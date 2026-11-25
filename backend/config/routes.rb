Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      namespace :insights do
        get :summary
      end
      resources :employees, only: %i[index show create update destroy] do
        get :filter_options, on: :collection
      end
    end
  end
end
