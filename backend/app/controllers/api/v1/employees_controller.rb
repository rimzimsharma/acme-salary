module Api
  module V1
    class EmployeesController < ApplicationController
      SEARCH_PARAMS = %i[q status country department job_title seniority sort dir page per_page].freeze

      def index
        result = EmployeeSearch.new(params.permit(*SEARCH_PARAMS)).call
        render json: {
          data: result.records.map { |employee| EmployeeSerializer.call(employee) },
          meta: { page: result.page, per_page: result.per_page, total: result.total,
                  total_pages: (result.total.to_f / result.per_page).ceil }
        }
      end
    end
  end
end
