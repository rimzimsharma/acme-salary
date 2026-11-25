module Api
  module V1
    class EmployeesController < ApplicationController
      SEARCH_PARAMS = %i[q status country department job_title seniority sort dir page per_page].freeze

      def create
        employee = Employee.new(employee_params)
        if employee.save
          render json: { data: EmployeeSerializer.call(employee) }, status: :created,
                 location: api_v1_employee_url(employee)
        else
          render json: { errors: employee.errors.to_hash }, status: :unprocessable_entity
        end
      end

      def update
        employee = Employee.find(params[:id])
        if employee.update(employee_params)
          render json: { data: EmployeeSerializer.call(employee) }
        else
          render json: { errors: employee.errors.to_hash }, status: :unprocessable_entity
        end
      end

      # Soft delete: HR keeps records of people who have left.
      def destroy
        employee = Employee.find(params[:id])
        employee.deactivate!
        render json: { data: EmployeeSerializer.call(employee) }
      end

      def filter_options
        render json: {
          countries: Employee.distinct.order(:country).pluck(:country),
          departments: Employee.distinct.order(:department).pluck(:department),
          job_titles: Employee.distinct.order(:job_title).pluck(:job_title),
          seniorities: Employee::SENIORITIES,
          currencies: Employee::CURRENCIES
        }
      end

      def show
        render json: { data: EmployeeSerializer.call(Employee.find(params[:id])) }
      end

      def index
        result = EmployeeSearch.new(params.permit(*SEARCH_PARAMS)).call
        render json: {
          data: result.records.map { |employee| EmployeeSerializer.call(employee) },
          meta: { page: result.page, per_page: result.per_page, total: result.total,
                  total_pages: (result.total.to_f / result.per_page).ceil }
        }
      end

      private

      def employee_params
        params.require(:employee).permit(:full_name, :email, :job_title, :department, :country,
                                         :currency, :annual_salary, :seniority, :hire_date)
      end
    end
  end
end
