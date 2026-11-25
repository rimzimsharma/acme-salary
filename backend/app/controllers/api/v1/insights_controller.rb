module Api
  module V1
    class InsightsController < ApplicationController
      def summary
        render json: Insights::Summary.call
      end

      def breakdown
        by = params[:by].to_s
        render json: { by: by, groups: Insights::Breakdown.call(by: by, filters: filter_params) }
      end

      private

      def filter_params
        params.permit(*Insights::Breakdown::DIMENSIONS).to_h
      end
    end
  end
end
