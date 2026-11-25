class CreateEmployees < ActiveRecord::Migration[7.2]
  def change
    create_table :employees do |t|
      t.string  :full_name,     null: false
      t.string  :email,         null: false
      t.string  :job_title,     null: false
      t.string  :department,    null: false
      t.string  :country,       null: false
      t.string  :currency,      null: false, limit: 3
      t.integer :annual_salary, null: false # whole units of `currency`; HR does not track cents
      t.string  :seniority,     null: false
      t.date    :hire_date,     null: false
      t.boolean :active,        null: false, default: true

      t.timestamps
    end

    add_index :employees, :email, unique: true
    # One index per filter promised in the requirements; composites serve the
    # "title within country" insight and the active-only default view.
    add_index :employees, %i[active country]
    add_index :employees, %i[active department]
    add_index :employees, %i[active seniority]
    add_index :employees, %i[active country job_title]
    add_index :employees, :full_name
  end
end
