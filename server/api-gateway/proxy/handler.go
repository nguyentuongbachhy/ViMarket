// handler.go - Sửa phần routing Order service
package proxy

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"api-gateway/config"

	"github.com/sirupsen/logrus"
)

type ServiceProxy struct {
	chatbotProxy  *httputil.ReverseProxy
	userProxy     *httputil.ReverseProxy
	productProxy  *httputil.ReverseProxy
	cartProxy     *httputil.ReverseProxy
	wishlistProxy *httputil.ReverseProxy
	orderProxy    *httputil.ReverseProxy
	reviewProxy   *httputil.ReverseProxy
	config        *config.Config
	logger        *logrus.Logger
}

func NewServiceProxy(cfg *config.Config, logger *logrus.Logger) (*ServiceProxy, error) {
	chatbotURL, err := url.Parse(cfg.Services.Chatbot)
	if err != nil {
		return nil, err
	}

	userURL, err := url.Parse(cfg.Services.User)
	if err != nil {
		return nil, err
	}

	productURL, err := url.Parse(cfg.Services.Product)
	if err != nil {
		return nil, err
	}

	cartURL, err := url.Parse(cfg.Services.Cart)
	if err != nil {
		return nil, err
	}

	wishlistURL, err := url.Parse(cfg.Services.Wishlist)
	if err != nil {
		return nil, err
	}

	orderURL, err := url.Parse(cfg.Services.Order)
	if err != nil {
		return nil, err
	}

	reviewURL, err := url.Parse(cfg.Services.Review)
	if err != nil {
		return nil, err
	}

	chatbotProxy := httputil.NewSingleHostReverseProxy(chatbotURL)
	userProxy := httputil.NewSingleHostReverseProxy(userURL)
	productProxy := httputil.NewSingleHostReverseProxy(productURL)
	cartProxy := httputil.NewSingleHostReverseProxy(cartURL)
	wishlistProxy := httputil.NewSingleHostReverseProxy(wishlistURL)
	orderProxy := httputil.NewSingleHostReverseProxy(orderURL)
	reviewProxy := httputil.NewSingleHostReverseProxy(reviewURL)

	configureProxy(chatbotProxy, "chatbot", logger)
	configureProxy(userProxy, "user", logger)
	configureProxy(productProxy, "product", logger)
	configureProxy(cartProxy, "cart", logger)
	configureProxy(wishlistProxy, "wishlist", logger)
	configureProxy(orderProxy, "order", logger)
	configureProxy(reviewProxy, "review", logger)

	return &ServiceProxy{
		chatbotProxy:  chatbotProxy,
		userProxy:     userProxy,
		productProxy:  productProxy,
		cartProxy:     cartProxy,
		wishlistProxy: wishlistProxy,
		orderProxy:    orderProxy,
		reviewProxy:   reviewProxy,
		config:        cfg,
		logger:        logger,
	}, nil
}

func (p *ServiceProxy) Handle() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		startTime := time.Now()

		path := strings.TrimPrefix(r.URL.Path, "/api/v1")
		r.URL.Path = path

		r.Header.Set("X-Forwarded-Host", r.Host)
		r.Header.Set("X-Origin-Host", r.Header.Get("Host"))
		r.Header.Set("X-Request-ID", r.Header.Get("X-Request-ID"))
		r.Header.Set("X-Original-URL", "/api/v1"+path)

		if strings.HasPrefix(path, "/cart") {
			p.logger.WithFields(logrus.Fields{
				"service": "cart",
				"path":    r.URL.Path,
				"method":  r.Method,
			}).Info("Routing to Cart service")

			p.cartProxy.ServeHTTP(w, r)
		} else if strings.HasPrefix(path, "/wishlist") {
			p.logger.WithFields(logrus.Fields{
				"service": "wishlist",
				"path":    r.URL.Path,
				"method":  r.Method,
			}).Info("Routing to Wishlist service")

			p.wishlistProxy.ServeHTTP(w, r)
		} else if strings.HasPrefix(path, "/reviews") {
			p.logger.WithFields(logrus.Fields{
				"service": "reviews",
				"path":    r.URL.Path,
				"method":  r.Method,
			}).Info("Routing to Review service")

			p.reviewProxy.ServeHTTP(w, r)
		} else if strings.HasPrefix(path, "/orders") ||
			strings.HasPrefix(path, "/orders-admin") {
			p.logger.WithFields(logrus.Fields{
				"service": "order",
				"path":    r.URL.Path,
				"method":  r.Method,
			}).Info("Routing to Order service")

			p.orderProxy.ServeHTTP(w, r)
		} else if strings.HasPrefix(path, "/chat") || strings.HasPrefix(path, "/history") {
			p.logger.WithFields(logrus.Fields{
				"service": "chatbot",
				"path":    r.URL.Path,
				"method":  r.Method,
			}).Info("Routing to Chatbot service")

			p.chatbotProxy.ServeHTTP(w, r)
		} else if strings.HasPrefix(path, "/auth") || strings.HasPrefix(path, "/user") {
			p.logger.WithFields(logrus.Fields{
				"service": "user",
				"path":    r.URL.Path,
				"method":  r.Method,
			}).Info("Routing to User service")

			p.userProxy.ServeHTTP(w, r)
		} else if strings.HasPrefix(path, "/products") ||
			strings.HasPrefix(path, "/categories") ||
			strings.HasPrefix(path, "/brands") {
			p.logger.WithFields(logrus.Fields{
				"service": "product",
				"path":    r.URL.Path,
				"method":  r.Method,
			}).Info("Routing to Product service")

			p.productProxy.ServeHTTP(w, r)
		} else {
			p.logger.WithFields(logrus.Fields{
				"path":   r.URL.Path,
				"method": r.Method,
			}).Warn("No route found for path")

			http.Error(w, "Not Found", http.StatusNotFound)
		}

		duration := time.Since(startTime).Milliseconds()
		p.logger.WithFields(logrus.Fields{
			"path":     r.URL.Path,
			"method":   r.Method,
			"duration": duration,
		}).Info("Request completed")
	}
}

func configureProxy(proxy *httputil.ReverseProxy, serviceName string, logger *logrus.Logger) {
	director := proxy.Director

	proxy.Director = func(req *http.Request) {
		director(req)

		// Đảm bảo tất cả services đều có prefix /api/v1
		if !strings.HasPrefix(req.URL.Path, "/api/v1") {
			req.URL.Path = "/api/v1" + req.URL.Path
		}

		logger.WithFields(logrus.Fields{
			"service":       serviceName,
			"original_path": req.URL.Path,
			"target_host":   req.URL.Host,
			"method":        req.Method,
		}).Debug("Proxying request")
	}

	proxy.ModifyResponse = func(resp *http.Response) error {
		// Remove CORS headers để tránh conflict
		resp.Header.Del("Access-Control-Allow-Origin")
		resp.Header.Del("Access-Control-Allow-Methods")
		resp.Header.Del("Access-Control-Allow-Headers")
		resp.Header.Del("Access-Control-Allow-Credentials")
		resp.Header.Del("Access-Control-Max-Age")
		resp.Header.Del("Access-Control-Expose-Headers")
		resp.Header.Del("Vary")

		logger.WithFields(logrus.Fields{
			"service": serviceName,
			"status":  resp.StatusCode,
		}).Debug("Response received from service")

		return nil
	}

	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		logger.WithFields(logrus.Fields{
			"service": serviceName,
			"path":    r.URL.Path,
			"method":  r.Method,
			"error":   err.Error(),
		}).Error("Proxy error")

		w.Header().Set("Content-Type", "application/json")
		http.Error(w, `{"status":"error","message":"Service Unavailable"}`, http.StatusServiceUnavailable)
	}
}
