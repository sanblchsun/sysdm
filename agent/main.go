package main

import (
	"fmt"
	"time"
)

func main() {
	var agentID int
	id, err := readAgentID()
	if err != nil || id == 0 {
		fmt.Println("Registering agent...")
		agentID, err = registerAgent()
		if err != nil {
			fmt.Println("Failed to register agent:", err)
			return
		}
		writeAgentID(agentID)
		fmt.Println("Registered agent with ID:", agentID)
	} else {
		agentID = id
		fmt.Println("Loaded existing agent ID:", agentID)
	}

	ticker := time.NewTicker(time.Second * CheckinIntervalSeconds)
	defer ticker.Stop()

	for {
		checkin(agentID) // на сервере будет проверяться отдел и IP/hostname
		<-ticker.C
	}
}
