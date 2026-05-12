FROM golang:1.25-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -o media-relay .

FROM alpine:latest

RUN apk add --no-cache ca-certificates

COPY --from=builder /app/media-relay /usr/local/bin/media-relay

EXPOSE 8001/tcp
EXPOSE 10000-20000/udp

ENTRYPOINT ["media-relay"]
