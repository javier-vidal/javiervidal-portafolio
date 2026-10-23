# Etapa 1: compila un binario estatico.
FROM golang:1.27 AS build
WORKDIR /src
COPY go.mod ./
COPY *.go ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/api .

# Etapa 2: imagen minima, sin shell y con usuario sin privilegios.
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/api /api
# Solo informativo: la API escucha en el puerto de la variable PORT (Render la define).
EXPOSE 8090
ENTRYPOINT ["/api"]
