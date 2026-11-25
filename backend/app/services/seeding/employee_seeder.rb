module Seeding
  class EmployeeSeeder
    # Replaces all employees so the script is safe to re-run.
    def self.call(count:, batch_size: 1_000, seed: 42)
      Employee.delete_all
      EmployeeGenerator.new(count: count, seed: seed).each_slice(batch_size) do |batch|
        Employee.insert_all!(batch.map { |row| row.except(:outlier) })
      end
    end
  end
end
