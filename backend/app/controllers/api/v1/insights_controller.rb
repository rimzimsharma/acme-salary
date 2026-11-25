module Api
  module V1
    class InsightsController < ApplicationController
      def summary
        render json: Insights::Summary.call
      end
    end
  end
end
