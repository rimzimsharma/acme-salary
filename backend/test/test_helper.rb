ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Builds a valid, saved employee; override any attribute per test.
    def create_employee(overrides = {})
      @employee_sequence = (@employee_sequence || 0) + 1
      Employee.create!({
        full_name: "Person #{@employee_sequence}", email: "person#{@employee_sequence}@acme.test",
        job_title: "Software Engineer", department: "Engineering", country: "India", currency: "INR",
        annual_salary: 2_000_000, seniority: "mid", hire_date: Date.new(2022, 1, 1)
      }.merge(overrides))
    end
  end
end
