package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net"
	"net/http"
	"os"
)

type RegisterPayload struct {
	CompanyID int    `json:"company_id"`
	Hostname  string `json:"hostname"`
}

type RegisterResponse struct {
	AgentID int `json:"agent_id"`
}

type CheckinPayload struct {
	AgentID  int    `json:"agent_id"`
	IP       string `json:"ip_address"`
	Hostname string `json:"hostname"`
}

func getLocalIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "unknown"
	}
	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}
	return "unknown"
}

func getHostname() string {
	name, err := os.Hostname()
	if err != nil {
		return "unknown"
	}
	return name
}

func readAgentID() (int, error) {
	data, err := ioutil.ReadFile("agent_id.txt")
	if err != nil {
		return 0, err
	}
	var id int
	_, err = fmt.Sscanf(string(data), "%d", &id)
	return id, err
}

func writeAgentID(id int) error {
	return ioutil.WriteFile("agent_id.txt", []byte(fmt.Sprintf("%d", id)), 0644)
}

func registerAgent() (int, error) {
	payload := RegisterPayload{
		CompanyID: CompanyID,
		Hostname:  getHostname(),
	}
	data, _ := json.Marshal(payload)
	resp, err := http.Post(ServerURL+"/api/v1/agents/register", "application/json", bytes.NewBuffer(data))
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	body, _ := ioutil.ReadAll(resp.Body)

	if resp.StatusCode != 200 {
		return 0, fmt.Errorf("registration failed: %s", string(body))
	}

	var res RegisterResponse
	json.Unmarshal(body, &res)
	return res.AgentID, nil
}

// checkin отправляет информацию о текущем IP и hostname на сервер
func checkin(agentID int) {
	payload := CheckinPayload{
		AgentID:  agentID,
		IP:       getLocalIP(),
		Hostname: getHostname(),
	}
	data, _ := json.Marshal(payload)
	resp, err := http.Post(ServerURL+"/api/v1/agents/checkin", "application/json", bytes.NewBuffer(data))
	if err != nil {
		fmt.Println("Checkin error:", err)
		return
	}
	resp.Body.Close()
	fmt.Println("Checked in agent", agentID)
}
