package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/pion/webrtc/v4"
	"github.com/pion/webrtc/v4/pkg/media"
)

const (
	ingestPort = 8001
	cleanupAge = 60 * time.Second
	maxBuf     = 4 * 1024 * 1024
	trimBuf    = 2 * 1024 * 1024
)

var (
	agentsMu  sync.Mutex
	agents    = map[string]*AgentStream{}
	webrtcAPI *webrtc.API
)

type peerTrack struct {
	track *webrtc.TrackLocalStaticSample
	pc    *webrtc.PeerConnection
}

type AgentStream struct {
	mu         sync.Mutex
	keyBufRaw  []byte
	leftover   []byte
	spsLogged  bool
	spsCache   []byte
	ppsCache   []byte
	tracks     []*peerTrack
	startTime  time.Time
	lastAccess time.Time
	peers      int
}

func getAgent(id string) *AgentStream {
	agentsMu.Lock()
	defer agentsMu.Unlock()
	a, ok := agents[id]
	if !ok {
		a = &AgentStream{startTime: time.Now()}
		agents[id] = a
	}
	return a
}

// ------- H.264 parsing -------

func findNALUs(data []byte) [][]byte {
	var out [][]byte
	i := 0
	for i+3 < len(data) {
		if data[i] != 0 || data[i+1] != 0 {
			i++
			continue
		}
		scLen := 0
		if data[i+2] == 1 {
			scLen = 3
		} else if i+3 < len(data) && data[i+2] == 0 && data[i+3] == 1 {
			scLen = 4
		}
		if scLen == 0 {
			i++
			continue
		}
		nalStart := i + scLen
		next := nextStartCode(data, nalStart)
		var nalu []byte
		if next < 0 {
			nalu = make([]byte, len(data)-nalStart)
			copy(nalu, data[nalStart:])
			i = len(data)
		} else {
			nalu = make([]byte, next-nalStart)
			copy(nalu, data[nalStart:next])
			i = next
		}
		if len(nalu) > 0 {
			out = append(out, nalu)
		}
	}
	return out
}

func lastStartCode(data []byte) int {
	last := -1
	for i := 0; i+3 < len(data); i++ {
		if data[i] == 0 && data[i+1] == 0 {
			if data[i+2] == 1 {
				last = i
			} else if i+3 < len(data) && data[i+2] == 0 && data[i+3] == 1 {
				last = i
			}
		}
	}
	return last
}

func nextStartCode(data []byte, from int) int {
	for i := from; i+3 < len(data); i++ {
		if data[i] == 0 && data[i+1] == 0 {
			if data[i+2] == 1 {
				return i
			}
			if i+3 < len(data) && data[i+2] == 0 && data[i+3] == 1 {
				return i
			}
		}
	}
	return -1
}

// ------- Sample writing (TrackLocalStaticSample) -------

func (a *AgentStream) writeSampleTo(pt *peerTrack, data []byte) {
	err := pt.track.WriteSample(media.Sample{
		Data:     data,
		Duration: time.Second / 30,
	})
	if err != nil {
		log.Printf("[sample] write error: %v", err)
	}
}

func (a *AgentStream) cacheSPSPPS(nalus [][]byte) {
	for _, nalu := range nalus {
		if len(nalu) == 0 {
			continue
		}
		typ := nalu[0] & 0x1f
		switch typ {
		case 7:
			a.spsCache = append([]byte(nil), nalu...)
			if !a.spsLogged {
				a.spsLogged = true
				p := nalu[1:]
				if len(p) >= 3 {
					log.Printf("[sps] profile=%02x constraints=%02x level=%02x -> pli=%02x%02x%02x",
						p[0], p[1], p[2], p[0], p[1], p[2])
				}
			}
		case 8:
			a.ppsCache = append([]byte(nil), nalu...)
		}
	}
}

// sendNalu builds a sample from SPS/PPS + one frame NALU and writes to all tracks
func (a *AgentStream) sendNalu(nalu []byte) {
	if len(a.tracks) == 0 {
		return
	}
	sample := make([]byte, 0, len(nalu)+64)
	if a.spsCache != nil {
		sample = append(sample, 0, 0, 0, 1)
		sample = append(sample, a.spsCache...)
	}
	if a.ppsCache != nil {
		sample = append(sample, 0, 0, 0, 1)
		sample = append(sample, a.ppsCache...)
	}
	sample = append(sample, 0, 0, 0, 1)
	sample = append(sample, nalu...)
	for _, pt := range a.tracks {
		a.writeSampleTo(pt, sample)
	}
}

func (a *AgentStream) feed(data []byte) {
	a.mu.Lock()
	defer a.mu.Unlock()

	a.lastAccess = time.Now()

	a.keyBufRaw = append(a.keyBufRaw, data...)
	if len(a.keyBufRaw) > maxBuf {
		a.keyBufRaw = a.keyBufRaw[len(a.keyBufRaw)-trimBuf:]
	}

	// always process NALUs for SPS/PPS caching, even without tracks
	a.leftover = append(a.leftover, data...)

	lastSC := lastStartCode(a.leftover)
	if lastSC < 0 {
		return
	}

	nalus := findNALUs(a.leftover[:lastSC])
	if len(nalus) == 0 {
		keep := make([]byte, len(a.leftover)-lastSC)
		copy(keep, a.leftover[lastSC:])
		a.leftover = keep
		return
	}

	keep := make([]byte, len(a.leftover)-lastSC)
	copy(keep, a.leftover[lastSC:])
	a.leftover = keep

	a.cacheSPSPPS(nalus)

	if len(a.tracks) == 0 {
		return
	}

	// send each frame NALU as an individual sample (one WriteSample per NALU)
	for _, nalu := range nalus {
		if len(nalu) == 0 {
			continue
		}
		typ := nalu[0] & 0x1f
		if typ != 1 && typ != 5 {
			continue
		}
		a.sendNalu(nalu)
	}
}

func (a *AgentStream) addPeer(pc *webrtc.PeerConnection) (*peerTrack, error) {
	track, err := webrtc.NewTrackLocalStaticSample(
		webrtc.RTPCodecCapability{
			MimeType:    "video/H264",
			ClockRate:   90000,
			SDPFmtpLine: "level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f",
		},
		"video",
		"pion",
	)
	if err != nil {
		return nil, fmt.Errorf("new track: %w", err)
	}

	if _, err := pc.AddTrack(track); err != nil {
		return nil, fmt.Errorf("add track: %w", err)
	}

	a.mu.Lock()
	pt := &peerTrack{track: track, pc: pc}
	a.tracks = append(a.tracks, pt)
	a.peers++
	a.mu.Unlock()

	return pt, nil
}

func (a *AgentStream) sendKeyframeTo(pt *peerTrack) {
	a.mu.Lock()
	defer a.mu.Unlock()

	if len(a.keyBufRaw) == 0 && a.spsCache == nil {
		return
	}

	// send cached SPS/PPS first
	if a.spsCache != nil {
		sample := []byte{0, 0, 0, 1}
		sample = append(sample, a.spsCache...)
		if a.ppsCache != nil {
			sample = append(sample, 0, 0, 0, 1)
			sample = append(sample, a.ppsCache...)
		}
		log.Printf("[sendKeyframe] sending SPS/PPS (%d bytes) to new peer", len(sample))
		a.writeSampleTo(pt, sample)
	}

	// then find and send each frame NALU from raw buffer
	if len(a.keyBufRaw) > 0 {
		nalus := findNALUs(a.keyBufRaw)
		count := 0
		for _, nalu := range nalus {
			if len(nalu) == 0 {
				continue
			}
			typ := nalu[0] & 0x1f
			if typ != 1 && typ != 5 {
				continue
			}
			// build sample with cached SPS/PPS + this NALU
			sample := make([]byte, 0, len(nalu)+64)
			if a.spsCache != nil {
				sample = append(sample, 0, 0, 0, 1)
				sample = append(sample, a.spsCache...)
			}
			if a.ppsCache != nil {
				sample = append(sample, 0, 0, 0, 1)
				sample = append(sample, a.ppsCache...)
			}
			sample = append(sample, 0, 0, 0, 1)
			sample = append(sample, nalu...)
			a.writeSampleTo(pt, sample)
			count++
			if count >= 30 {
				break
			}
		}
		log.Printf("[sendKeyframe] sent %d frames to new peer", count)
	}
}

func (a *AgentStream) removePeer(track *webrtc.TrackLocalStaticSample) {
	a.mu.Lock()
	defer a.mu.Unlock()
	for i, pt := range a.tracks {
		if pt.track == track {
			a.tracks = append(a.tracks[:i], a.tracks[i+1:]...)
			a.peers--
			break
		}
	}
}

// ------- Background cleanup -------

func cleanupLoop() {
	for {
		time.Sleep(cleanupAge)
		now := time.Now()
		agentsMu.Lock()
		for id, a := range agents {
			a.mu.Lock()
			dead := now.Sub(a.lastAccess) > cleanupAge && a.peers == 0
			a.mu.Unlock()
			if dead {
				delete(agents, id)
				log.Printf("[cleanup] removed agent %s", id)
			}
		}
		agentsMu.Unlock()
	}
}

func notifyFastAPI(aid string, h http.Header) {
	u := fmt.Sprintf("http://%s/relay/internal/ingest-status/%s", fastAPIAddr, aid)
	req, err := http.NewRequest("POST", u, nil)
	if err != nil {
		return
	}
	for _, k := range []string{"x-agent-encoder", "x-agent-bitrate", "x-agent-fps"} {
		if v := h.Get(k); v != "" {
			req.Header.Set(k, v)
		}
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("[notify] fastapi error: %v", err)
		return
	}
	resp.Body.Close()
}

func heartbeatLoop(done <-chan struct{}, aid string) {
	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			u := fmt.Sprintf("http://%s/relay/internal/ingest-status/%s", fastAPIAddr, aid)
			resp, err := http.Post(u, "", nil)
			if err == nil {
				resp.Body.Close()
			}
		case <-done:
			return
		}
	}
}

func isH264Request(r *http.Request) bool {
	ct := strings.ToLower(r.Header.Get("Content-Type"))
	if strings.Contains(ct, "h264") || strings.Contains(ct, "h.264") {
		return true
	}
	enc := strings.ToLower(r.Header.Get("x-agent-encoder"))
	if strings.Contains(enc, "h264") || strings.Contains(enc, "h.264") {
		return true
	}
	return false
}

// ------- HTTP handlers -------

var fastAPIAddr = "127.0.0.1:8000"

func handleIngest(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("aid")
	if id == "" {
		http.Error(w, "missing aid", 400)
		return
	}

	if !isH264Request(r) {
		log.Printf("[ingest] start aid=%s mjpeg (proxy to fastapi)", id)
		proxyToFastAPI(w, r)
		return
	}

	a := getAgent(id)
	log.Printf("[ingest] start aid=%s h264 ct=%s encoder=%s",
		id, r.Header.Get("Content-Type"), r.Header.Get("x-agent-encoder"))

	go notifyFastAPI(id, r.Header)
	hbDone := make(chan struct{})
	go heartbeatLoop(hbDone, id)
	defer close(hbDone)

	first := true
	buf := make([]byte, 65536)
	for {
		n, err := r.Body.Read(buf)
		if n > 0 {
			if first {
				d := buf[:n]
				if len(d) > 16 {
					d = d[:16]
				}
				log.Printf("[ingest] first chunk: %d bytes, hex=% x", n, d)
				first = false
			}
			a.feed(buf[:n])
		}
		if err != nil {
			break
		}
	}
	log.Printf("[ingest] end aid=%s", id)
	w.Write([]byte(`{"status":"ok","mode":"h264"}`))
}

func proxyToFastAPI(w http.ResponseWriter, r *http.Request) {
	url := fmt.Sprintf("http://%s%s", fastAPIAddr, r.URL.RequestURI())
	proxyReq, err := http.NewRequest(r.Method, url, r.Body)
	if err != nil {
		http.Error(w, err.Error(), 502)
		return
	}
	for k, v := range r.Header {
		proxyReq.Header[k] = v
	}
	resp, err := http.DefaultClient.Do(proxyReq)
	if err != nil {
		http.Error(w, err.Error(), 502)
		return
	}
	defer resp.Body.Close()
	for k, v := range resp.Header {
		w.Header()[k] = v
	}
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

type sdpPayload struct {
	SDP string `json:"sdp"`
}

func handleOffer(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("aid")
	if id == "" {
		http.Error(w, "missing aid", 400)
		return
	}

	var req sdpPayload
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", 400)
		return
	}

	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{},
	}
	pc, err := webrtcAPI.NewPeerConnection(config)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	a := getAgent(id)
	pt, err := a.addPeer(pc)
	if err != nil {
		pc.Close()
		http.Error(w, err.Error(), 500)
		return
	}

	pc.OnICEConnectionStateChange(func(state webrtc.ICEConnectionState) {
		log.Printf("[webrtc] %s state=%s", id, state)
		switch state {
		case webrtc.ICEConnectionStateDisconnected,
			webrtc.ICEConnectionStateFailed,
			webrtc.ICEConnectionStateClosed:
			a.removePeer(pt.track)
			pc.Close()
		}
	})

	offer := webrtc.SessionDescription{
		Type: webrtc.SDPTypeOffer,
		SDP:  req.SDP,
	}
	if err := pc.SetRemoteDescription(offer); err != nil {
		a.removePeer(pt.track)
		pc.Close()
		http.Error(w, err.Error(), 500)
		return
	}

	answer, err := pc.CreateAnswer(nil)
	if err != nil {
		a.removePeer(pt.track)
		pc.Close()
		http.Error(w, err.Error(), 500)
		return
	}
	if err := pc.SetLocalDescription(answer); err != nil {
		a.removePeer(pt.track)
		pc.Close()
		http.Error(w, err.Error(), 500)
		return
	}

	<-webrtc.GatheringCompletePromise(pc)

	// send stored keyframe to new peer
	a.sendKeyframeTo(pt)

	ld := pc.LocalDescription()
	if ld == nil {
		a.removePeer(pt.track)
		pc.Close()
		http.Error(w, "no local description", 500)
		return
	}

	// Log relevant SDP lines
	plID := ""
	for _, line := range strings.Split(ld.SDP, "\n") {
		if strings.Contains(line, "profile-level-id") {
			plID = strings.TrimSpace(line)
		}
	}
	log.Printf("[webrtc] %s answer done (candidates: %d, profile-level-id: %s)",
		id, strings.Count(ld.SDP, "a=candidate"), plID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sdpPayload{SDP: ld.SDP})
}

// ------- Main -------

func main() {
	log.SetFlags(log.Ltime | log.Lmicroseconds)

	webrtcAPI = webrtc.NewAPI()

	go cleanupLoop()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /ingest/{aid}", handleIngest)
	mux.HandleFunc("POST /relay/ingest/{aid}", handleIngest)
	mux.HandleFunc("POST /relay/webrtc-offer/{aid}", handleOffer)

	addr := fmt.Sprintf(":%d", ingestPort)
	log.Printf("[relay] listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}
