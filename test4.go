package main

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

type point struct {
	name string
	x    int
	y    int
	msg  string
}

var points []point

func main() {
	// 在/后面加上 index ，来指定访问路径
	hub := newHub()
	go hub.run()
	http.HandleFunc("/", index)
	http.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("./dist/css"))))
	http.Handle("/js/", http.StripPrefix("/js/", http.FileServer(http.Dir("./dist/js"))))
	http.Handle("/img/", http.StripPrefix("/img/", http.FileServer(http.Dir("./dist/img"))))
	http.Handle("/pic/", http.StripPrefix("/pic/", http.FileServer(http.Dir("./dist/pic"))))
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})
	err := http.ListenAndServe("localhost:8077", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}

}

func index(w http.ResponseWriter, r *http.Request) {
	content, e := ioutil.ReadFile("./dist/index.html")
	if e != nil {
		fmt.Println(e)
	}
	w.Write([]byte(content))

}

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 512
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	hub *Hub

	// The websocket connection.
	conn *websocket.Conn

	// Buffered channel of outbound messages.
	send chan []byte
}

// readPump pumps messages from the websocket connection to the hub.
//
// The application runs readPump in a per-connection goroutine. The application
// ensures that there is at most one reader on a connection by executing all
// reads from this goroutine.
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		message = bytes.TrimSpace(bytes.Replace(message, newline, space, -1))
		ms := strings.Split(string(message[:]), "!")
		name := ms[0]
		flag := 1
		pos := 0
		for i := 0; i < len(points); i++ {
			if points[i].name == name {
				pos = i
				flag = 0
			}
		}
		x, _ := strconv.Atoi(ms[1])
		y, _ := strconv.Atoi(ms[2])
		if flag == 1 {
			var poi point

			poi = point{ms[0], x, y, ""}
			points = append(points, poi)

		} else {
			points[pos].x = x
			points[pos].y = y
			if len(ms) == 4 {
				points[pos].msg = ms[3]
			}
		}
		c.hub.broadcast <- message
	}
}

// writePump pumps messages from the hub to the websocket connection.
//
// A goroutine running writePump is started for each connection. The
// application ensures that there is at most one writer to a connection by
// executing all writes from this goroutine.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod * 100)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case _, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			var sendm string
			sendm = ""
			for i := 0; i < len(points); i++ {
				sendm += points[i].name + "!" + strconv.Itoa(points[i].x+100) + "!" + strconv.Itoa(points[i].y)
				if points[i].msg != "" {
					sendm += "!" + points[i].msg
				}
				if i != len(points)-1 {
					sendm += "|"
				}
			}

			w.Write([]byte(sendm))
			// w.Write(message)

			// Add queued chat messages to the current websocket message.
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write(newline)
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// serveWs handles websocket requests from the peer.
func serveWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	fmt.Println("connected!!!")
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	// for {
	// 	conn.WriteMessage(websocket.TextMessage, []byte("dfa,100,100|fdaf,300,300"))
	// }
	client := &Client{hub: hub, conn: conn, send: make(chan []byte, 256)}
	client.hub.register <- client

	// // Allow collection of memory referenced by the caller by doing all work in
	// // new goroutines.
	go client.writePump()
	go client.readPump()
}

type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

func newHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}
func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				fmt.Println("1 conn closed")
				delete(h.clients, client)
				close(client.send)
			}
		case message := <-h.broadcast:
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}
