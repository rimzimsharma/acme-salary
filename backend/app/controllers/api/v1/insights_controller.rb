module Api
  module V1
    class InsightsController < ApplicationController
      rescue_from ArgumentError do |error|
        render json: { error: error.message }, status: :bad_request
      end

      def summary
        render json: Insights::Summary.call
      end

      def breakdown
        by = params[:by].to_s
        render json: { by: by, groups: Insights::Breakdown.call(by: by, filters: filter_params) }
      end

      def outliers
        limit = params[:limit].to_i.clamp(1, 200) if params[:limit].present?
        render json: { outliers: Insights::Outliers.call(**{ limit: limit }.compact) }
      end

      private

      def filter_params
        params.permit(*Insights::Breakdown::DIMENSIONS).to_h
      end
    end
  end
end
