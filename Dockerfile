FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/server

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/main .
COPY --from=builder /app/web ./web
COPY --from=builder /app/uploads ./uploads
COPY --from=builder /app/migrations ./migrations

RUN mkdir -p ./uploads/images

EXPOSE 8080

CMD ["./main"]