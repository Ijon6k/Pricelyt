# --- build stage ---
FROM golang:1.25-alpine AS build

WORKDIR /src

# Cache module downloads separately from source.
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Static binary so it runs on a tiny scratch/alpine runtime.
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/api ./cmd/server

# --- runtime stage ---
FROM alpine:3.20

RUN apk add --no-cache ca-certificates wget && adduser -D -u 10001 appuser

WORKDIR /app
COPY --from=build /out/api /app/api

USER appuser
EXPOSE 8080

CMD ["/app/api"]
