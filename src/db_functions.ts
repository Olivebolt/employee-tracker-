import "colors";
import { input, number, select } from "@inquirer/prompts";
import { QueryResult } from "pg";

import { pool, connectToDb } from "./connection.js";

connectToDb();

class Choice {
  name: string;
  value: any;
  constructor(name: string, value: any) {
    this.name = name;
    this.value = value;
  }
}

/**
 * Holds the data for a department that matches the columns of the department table in the database
 */
class Department {
  id: number;
  name: string;

  constructor(id: number, name: string) {
    if (name.length > 30) {
      throw new Error("Name cannot be over 30 characters.");
    }

    this.id = id;
    this.name = name;
  }

  public get formattedName(): string {
    return `${this.name} (${this.id})`;
  }
}

/**
 * Holds the data for a role that matches the columns of the role table in the database
 */
class Role {
  id: number;
  title: string;
  salary: number;
  departmentId: number;

  constructor(id: number, title: string, salary: number, departmentId: number) {
    if (title.length > 30) {
      throw new Error("Title cannot be over 30 characters.");
    }

    this.id = id;
    this.title = title;
    this.salary = salary;
    this.departmentId = departmentId;
  }

  public get formattedName(): string {
    return `${this.title} (${this.id})`;
  }
}

/**
 * Holds the data for a employee that matches the columns of the employee table in the database
 */
class Employee {
  id: number;
  firstName: string;
  lastName: string;
  roleId: number;
  managerId: number | null;

  constructor(
    id: number,
    firstName: string,
    lastName: string,
    roleId: number,
    managerId: number
  ) {
    if (firstName.length > 30) {
      throw new Error("First name cannot be over 30 characters.");
    } else if (lastName.length > 30) {
      throw new Error("Last name cannot be over 30 characters.");
    }

    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.roleId = roleId;
    this.managerId = managerId;
  }

  public get formattedName(): string {
    return `${this.firstName} ${this.lastName} (${this.id})`;
  }
}

class DatabaseFunctions {
  constructor() {}

  /**
   *
   * @returns An array of strings holding all the departments in the database
   */
  private async GetDepartments(): Promise<Department[]> {
    return new Promise((resolve, reject) => {
      const outputArray: Department[] = [];
      pool.query(
        "SELECT * FROM department",
        [],
        (err: Error, result: QueryResult) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            result.rows.forEach((row) => {
              const department: Department = new Department(
                row.id,
                row.department_name
              );
              outputArray.push(department);
            });
            resolve(outputArray);
          }
        }
      );
    });
  }

  /**
   *
   * @returns An array of strings holding all the roles in the database
   */
  private async GetRoles(): Promise<Role[]> {
    return new Promise((resolve, reject) => {
      const outputArray: Role[] = [];
      pool.query(
        "SELECT * FROM role",
        [],
        (err: Error, result: QueryResult) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            result.rows.forEach((row) => {
              const role: Role = new Role(
                row.id,
                row.title,
                row.salary,
                row.department_id
              );
              outputArray.push(role);
            });
            resolve(outputArray);
          }
        }
      );
    });
  }

  /**
   *
   * @returns An array of strings holding all the employees in the database
   */
  private async GetEmployees(): Promise<Employee[]> {
    return new Promise((resolve, reject) => {
      const outputArray: Employee[] = [];
      pool.query(
        "SELECT * FROM employee",
        [],
        (err: Error, result: QueryResult) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            result.rows.forEach((row) => {
              const role: Employee = new Employee(
                row.id,
                row.first_name,
                row.last_name,
                row.role_id,
                row.manager_id
              );
              outputArray.push(role);
            });
            resolve(outputArray);
          }
        }
      );
    });
  }

  /**
   * Prints all the departments in the database in a formatted table
   */
  async ViewAllDepartments() {
    console.clear();
    // The maximum length a string can be in the database "VARCHAR(30)"
    const maxStringLength = 30;

    // The array holding all the departments
    const departmentArray: Department[] = await this.GetDepartments();

    // Printing the table's title centered. it adds spaces that are equal to the maximum string length (plus 5 for the ids length)
    // minus the title so that we have an offset
    // Then we divide that offset by 2 so that the spaces are halfway making the padding to center the title!
    console.log(
      " ".repeat((maxStringLength + 5 - "Departments".length) / 2) +
        "Departments"
    );

    // Printing table column headers.
    console.log(
      "Department Name" +
        " ".repeat(maxStringLength - "Department Name".length) +
        "│ " +
        "ID"
    );
    // The dividing line
    console.log("─".repeat(maxStringLength) + "┼" + "─────");

    departmentArray.forEach((department) => {
      const padding = maxStringLength - department.name.length;
      // Printing each row of the table
      console.log(
        department.name.yellow +
          " ".repeat(padding) +
          "│ " +
          department.id.toString().bold
      );
    });

    // Adding a new line to add a margin of white space around the table
    console.log();
    // Resumes after the user presses enter
    await input({ message: "Press Enter to continue..." });
  }

  /**
   * Prints all the roles in the database in a formatted table
   */
  async ViewAllRoles() {
    // The list of departments in the database
    const departments: Department[] = await this.GetDepartments();
    // The list of roles in the database
    const roles: Role[] = await this.GetRoles();
    // The maximum length a string can be in the database "VARCHAR(30)"
    const maxStringLength: number = 30;

    // Printing the table column headers
    console.log(
      "Title" +
        " ".repeat(maxStringLength - "Title".length) +
        "│ " +
        "ID" +
        " ".repeat(2) +
        "│ " +
        "Salary" +
        " ".repeat(maxStringLength / 2 - "Salary".length) +
        "│ " +
        "Department (ID)"
    );

    // Printing the divider
    console.log(
      "─".repeat(maxStringLength) +
        "┼" +
        "─".repeat(5) +
        "┼" +
        "─".repeat(maxStringLength / 2 + 1) +
        "┼" +
        "─".repeat(maxStringLength)
    );

    // Getting the department connected to the roles ID
    roles.forEach((role) => {
      let departmentInfo: Department = new Department(NaN, "N/A");
      departments.forEach((department) => {
        if (department.id == role.departmentId) {
          departmentInfo = department;
        }
      });

      // Printing each row!
      console.log(
        role.title.yellow +
          " ".repeat(maxStringLength - role.title.length) +
          "│ " +
          role.id +
          " ".repeat(4 - role.id.toString().length) +
          "│ " +
          role.salary +
          " ".repeat(maxStringLength / 2 - role.salary.toString().length) +
          "│ " +
          departmentInfo.formattedName
      );
    });

    console.log();
    await input({ message: "Press enter to continue" });
  }

  /**
   * Prints all the employees in the database in a formatted table
   */
  async ViewAllEmployees() {
    const maxStringLength: number = 30;

    const roles = await this.GetRoles();
    const employees = await this.GetEmployees();

    // Printing column headers
    console.log(
      "First Name" +
        " ".repeat(maxStringLength - "First Name".length) +
        "│ " +
        "Last Name" +
        " ".repeat(maxStringLength - "Last Name".length) +
        "│ " +
        "ID" +
        " ".repeat(2) +
        "│ " +
        "Role (ID)" +
        " ".repeat(maxStringLength - "Role (ID)".length) +
        "│ " +
        "Manager (ID)"
    );

    // Printing the divider
    console.log(
      "─".repeat(maxStringLength) +
        "┼" +
        "─".repeat(maxStringLength + 1) +
        "┼" +
        "─".repeat(5) +
        "┼" +
        "─".repeat(maxStringLength + 1) +
        "┼" +
        "─".repeat(maxStringLength - 1)
    );

    employees.forEach((employee) => {
      let manager: Employee | null = new Employee(NaN, "N/A", "N/A", NaN, NaN);
      let role: Role = new Role(NaN, "N/A", NaN, NaN);

      // If the employee doesn't have a manager (Is top boss) then we set it to null
      if (employee.managerId == null) {
        manager = null;
      } else {
        // We compare the id of the item in the loop to the employee and if the manager ID on the employee is equal to the id of the potential manager, then we have found our manager!
        employees.forEach((potentialManager) => {
          if (potentialManager.id == employee.managerId) {
            manager = potentialManager;
          }
        });
      }
      // We compare the role id on the employee to each id of the roles and if they match then we found out role!
      roles.forEach((potentialRole) => {
        if (potentialRole.id == employee.roleId) {
          role = potentialRole;
        }
      });

      // If the employee has a manager then we print the row, with the manager information
      if (manager) {
        console.log(
          employee.firstName.yellow +
            " ".repeat(maxStringLength - employee.firstName.length) +
            "│ " +
            employee.lastName.yellow +
            " ".repeat(maxStringLength - employee.lastName.length) +
            "│ " +
            employee.id +
            " ".repeat(4 - employee.id.toString().length) +
            "│ " +
            role.title +
            " (" + // 2 characters
            role.id +
            ")" + // 1 character
            " ".repeat(
              maxStringLength -
                (role.title.length + 2 + role.id.toString().length + 1)
            ) +
            "│ " +
            manager.firstName.yellow +
            " " +
            manager.lastName.yellow +
            " (" +
            manager.id +
            ")"
        );
        // If the employee DOESN'T have a manager, then we print the row, and state that the employee does not have a manager
      } else {
        console.log(
          employee.firstName.yellow +
            " ".repeat(maxStringLength - employee.firstName.length) +
            "│ " +
            employee.lastName.yellow +
            " ".repeat(maxStringLength - employee.lastName.length) +
            "│ " +
            employee.id +
            " ".repeat(4 - employee.id.toString().length) +
            "│ " +
            role.title +
            " (" + // 2 characters
            role.id +
            ")" + // 1 character
            " ".repeat(
              maxStringLength -
                (role.title.length + 2 + role.id.toString().length + 1)
            ) +
            "│ " +
            "Has no manager".red
        );
      }
    });

    console.log();
    await input({ message: "Press enter to continue" });
  }

  // Adds a department to the database
  async AddDepartment() {
    // Collecting the new department's name
    const departmentName = await input({
      message: "Enter name for the new department",
    });
    // If the department already exists then
    const departments = await this.GetDepartments();
    departments.forEach((department) => {
      if (department.name == departmentName) {
        throw new Error(
          "Department name cannot match existing department name! Existing department: " +
            department.formattedName
        );
      } else if (departmentName.length > 30) {
        throw new Error(
          "Department name cannot be greater than 30 characters."
        );
      }
    });

    // Querying database to add new department
    pool.query(
      `INSERT INTO department (department_name) VALUES ('${departmentName}')`,
      [],
      (err: Error) => {
        if (err) {
          throw new Error("Error: " + err);
        }
        console.log(
          "Row",
          departmentName,
          "successfully added to the departments table!"
        );
      }
    );
  }

  // Adds a role to the database
  async AddRole() {
    const departmentSelectArray: Choice[] = [];
    const departments = await this.GetDepartments();
    departments.forEach((department) => {
      departmentSelectArray.push(
        new Choice(department.formattedName, department.id)
      );
    });

    // Collecting the new roles's title
    const roleTitle = await input({
      message: "Enter name for the new role",
    });
    // Collecting the new roles salary
    const roleSalary = await number({
      message: "Enter salary for the new role",
    });
    // Collecting the new roles department it belongs to
    const roleDepartment = await select({
      message: "Enter department the new role is part of.",
      choices: departmentSelectArray,
    });

    // If the role already exists then throw error
    const roles = await this.GetRoles();
    roles.forEach((role) => {
      if (role.title == roleTitle) {
        throw new Error(
          "Role name cannot match existing role name! Existing role: " +
            role.formattedName
        );
      } else if (roleTitle.length > 30) {
        throw new Error("Role name cannot be greater than 30 characters");
      }
    });

    // Querying database to add new role
    pool.query(
      `INSERT INTO role (title, salary, department_id) VALUES ('${roleTitle}', ${roleSalary}, ${roleDepartment})`,
      [],
      (err: Error) => {
        if (err) {
          throw new Error("Error: " + err);
        }
        console.log("Row", roleTitle, "successfully added to the roles table!");
      }
    );
  }

  // Adds a employee to the database
  async AddEmployee() {
    // Making choice array for roles
    const roleSelectArray: Choice[] = [];
    const roles = await this.GetRoles();
    roles.forEach((role) => {
      roleSelectArray.push(new Choice(role.formattedName, role.id));
    });

    // Making choice array for managers
    const managerSelectArray: Choice[] = [];
    const employees = await this.GetEmployees();
    managerSelectArray.push(new Choice("NO MANAGER".bgBlack.white, null));
    employees.forEach((employee) => {
      managerSelectArray.push(new Choice(employee.formattedName, employee.id));
    });

    // Collecting first name of new employee
    const firstName = await input({
      message: "Enter first name of new employee.",
    });
    // Collecting last name of new employee
    const lastName = await input({
      message: "Enter last name of new employee.",
    });
    // Collecting the role that the employee has
    const roleSelection = await select({
      message: "Select the role this employee holds",
      choices: roleSelectArray,
    });
    // Collecting the manager that the employee is under
    const managerSelection = await select({
      message: 'Select employee\'s manager, if none select "NO MANAGER"',
      choices: managerSelectArray,
    });

    // If the name is over 30 characters, throw an error!
    if (firstName.length > 30 || lastName.length > 30) {
      throw new Error("First and last name cannot be over 30 characters");
    }

    // Querying database to add new employee
    pool.query(
      `INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ('${firstName}', '${lastName}', ${roleSelection}, ${managerSelection})`,
      [],
      (err: Error) => {
        if (err) {
          throw new Error("Error: " + err);
        }
        console.log(
          "Row",
          firstName + " " + lastName,
          "successfully added to the employees table!"
        );
      }
    );
  }

  async UpdateEmployee() {
    // Fetch all employees and roles
    const employees = await this.GetEmployees();
    const roles = await this.GetRoles();

    // Create a selection prompt for employees
    const employeeSelectArray: Choice[] = employees.map(employee => new Choice(employee.formattedName, employee.id));
    const selectedEmployeeId = await select({
      message: "Select the employee you want to update:",
      choices: employeeSelectArray,
    });

    // Ask what they want to update (role, manager, etc.)
    const updateChoice = await select({
      message: "What do you want to update for this employee?",
      choices: [
        new Choice("Role", "role"),
        new Choice("Manager", "manager")
      ]
    });

    // Depending on the choice, prompt for the new value
    let updateQuery = "";
    let newValue: any;

    if (updateChoice === "role") {
      const roleSelectArray: Choice[] = roles.map(role => new Choice(role.formattedName, role.id));
      newValue = await select({
        message: "Select the new role for the employee:",
        choices: roleSelectArray,
      });
      updateQuery = `UPDATE employee SET role_id = ${newValue} WHERE id = ${selectedEmployeeId}`;
    } else if (updateChoice === "manager") {
      const managerSelectArray: Choice[] = employees.map(employee => new Choice(employee.formattedName, employee.id));
      managerSelectArray.unshift(new Choice("NO MANAGER", null));
      newValue = await select({
        message: "Select the new manager for the employee:",
        choices: managerSelectArray,
      });
      updateQuery = `UPDATE employee SET manager_id = ${newValue} WHERE id = ${selectedEmployeeId}`;
    }

    // Execute the update query in the database
    pool.query(updateQuery, [], (err: Error) => {
      if (err) {
        throw new Error("Error updating employee: " + err.message);
      }
      console.log("Employee updated successfully!");
    });

    await input({ message: "Press enter to continue..." });
  }

}

export default new DatabaseFunctions();
