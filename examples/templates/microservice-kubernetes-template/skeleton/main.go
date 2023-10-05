package main

import "net/http"

func main() {

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello Pulumi Backstage World"))
	})
	http.ListenAndServe(":9090", nil)
}
