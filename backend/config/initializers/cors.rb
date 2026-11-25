# Lets the Next.js frontend call this API from the browser. Origins come from
# FRONTEND_ORIGINS (comma-separated) and default to the local dev server.
allowed_origins = ENV.fetch("FRONTEND_ORIGINS", "http://localhost:3000").split(",").map(&:strip)

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*allowed_origins)
    resource "/api/*", headers: :any, methods: %i[get post patch delete options head]
  end
end
