# CS4218 Project - Virtual Vault - Team 17

[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=cs4218-2520-g17_ecom&metric=bugs)](https://sonarcloud.io/summary/new_code?id=cs4218-2520-g17_ecom)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=cs4218-2520-g17_ecom&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=cs4218-2520-g17_ecom)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=cs4218-2520-g17_ecom&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=cs4218-2520-g17_ecom)

[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=cs4218-2520-g17_ecom&metric=coverage)](https://sonarcloud.io/summary/new_code?id=cs4218-2520-g17_ecom)
[![CI - Run Tests and SonarQube Analysis](https://github.com/cs4218/cs4218-2520-ecom-project-cs4218-2520-team17/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/cs4218/cs4218-2520-ecom-project-cs4218-2520-team17/actions/workflows/ci.yml)

[![Quality gate](https://sonarcloud.io/api/project_badges/quality_gate?project=cs4218-2520-g17_ecom)](https://sonarcloud.io/summary/new_code?id=cs4218-2520-g17_ecom)

## MS1 CI URL
https://github.com/cs4218/cs4218-2520-ecom-project-cs4218-2520-team17/actions/runs/22290351579/job/64476379009

## Workload Distribution

### Milestone 1

#### Li Jiakai

**Server Related Files**
1. Admin Actions
   - `controllers/categoryController.js`
      - createCategoryController
      - updateCategoryController
      - deleteCategoryController
  
2. Admin View Products
   - `controllers/productController.js`
      - createProductController
      - deleteProductController
      - updateProductController 

**Client Related Files**
1. Admin Dashboard
   - `components/AdminMenu.js`
   - `pages/admin/AdminDashboard.js`
2. Admin Actions
   - `components/Form/CategoryForm.js` 
   - `pages/admin/CreateCategory.js`
   - `pages/admin/CreateProduct.js` 
   - `pages/admin/UpdateProduct.js`
3. Admin View Orders
   - `pages/admin/AdminOrders.js`
5. Admin View Products
   - `pages/admin/Products.js`
6. Admin View Users
   - `pages/admin/Users.js`
7. Admin Route
   - `components/Routes/AdminRoute.js`

#### Rayyan Ismail
**Server Related Files**
1. `controllers/categoryController.js`
   - categoryController
   - singleCategoryController

2. `controllers/productController.js`
   - braintreeTokenController
   - braintreePaymentController (renamed from brainTreePaymentController)

**Client Related Files**
1. `pages/Homepage.js`
2. `context/cart.js`
3. `pages/CartPage.js`
4. `hooks/useCategory.js`
5. `pages/Categories.js`

#### Sebastian Tay Yong Xun
**Server Related Files**
1. `controllers/authController.js`
   - updateProfileController
   - getOrdersController
   - getAllOrdersController
   - orderStatusController (Renamed to updateOrderStatusController)

Note: getOrdersController, getAllOrdersController, orderStatusController have been refactored to `controllers/orderController.js`

**Client Related Files**
1. `pages/user/Orders.js`
2. `pages/user/Profile.js`
3. `pages/Contact.js`
4. `pages/Policy.js`
5. `pages/About.js`
6. `pages/Pagenotfound.js`
7. `components/Footer.js`
8. `components/Header.js`
9. `components/Layout.js`
10. `components/Spinner.js`


#### Tan Shi Yu
**Server Related Files**
1. `controllers/productController.js`
   - getProductController
   - getSingleProductController
   - productPhotoController
   - productFiltersController
   - productCountController
   - productListController
   - searchProductController
   - relatedProductController
   - productCategoryController

**Client Related Files**
1. `components/Form/SearchInput.js`
2. `context/search.js`
3. `pages/Search.js`
4. `pages/ProductDetails.js`
5. `pages/CategoryProduct.js`

#### Tan Zhi Heng
**Server Related Files**
1. `helpers/authHelper.js`
2. `middlewares/authMiddleware.js`
3. `controllers/authController.js`
   - registerController
   - loginController
   - forgotPasswordController
   - testController

**Client Related Files**
1. `context/auth.js`
2. `pages/Auth/Register.js`
3. `pages/Auth/Login.js`


### Milestone 2

#### Li Jiakai

**Server Related Files**
 

**Client Related Files**

#### Rayyan Ismail
**Server Related Files**

**Client Related Files**

#### Sebastian Tay Yong Xun
**Server Related Files**
1. `controllers/orderController.js`
   - getOrdersController
   - getAllOrdersController
   - updateOrderStatusController
2. `config/db.js`

**Client Related Files**
1. `pages/user/Orders.js`
2. `pages/user/Profile.js`
3. `pages/Contact.js`
4. `pages/Policy.js`
5. `pages/About.js`
6. `pages/Pagenotfound.js`
7. `components/Footer.js`
8. `components/Header.js`
9. `components/Layout.js`
10. `components/Spinner.js`


#### Tan Shi Yu
**Server Related Files**

**Client Related Files**

#### Tan Zhi Heng
**Server Related Files**

**Client Related Files**

---

## 1. Project Introduction

Virtual Vault is a full-stack MERN (MongoDB, Express.js, React.js, Node.js) e-commerce website, offering seamless connectivity and user-friendly features. The platform provides a robust framework for online shopping. The website is designed to adapt to evolving business needs and can be efficiently extended.

## 2. Website Features

- **User Authentication**: Secure user authentication system implemented to manage user accounts and sessions.
- **Payment Gateway Integration**: Seamless integration with popular payment gateways for secure and reliable online transactions.
- **Search and Filters**: Advanced search functionality and filters to help users easily find products based on their preferences.
- **Product Set**: Organized product sets for efficient navigation and browsing through various categories and collections.

## 3. Your Task

- **Unit and Integration Testing**: Utilize Jest for writing and running tests to ensure individual components and functions work as expected, finding and fixing bugs in the process.
- **UI Testing**: Utilize Playwright for UI testing to validate the behavior and appearance of the website's user interface.
- **Code Analysis and Coverage**: Utilize SonarQube for static code analysis and coverage reports to maintain code quality and identify potential issues.
- **Load Testing**: Leverage JMeter for load testing to assess the performance and scalability of the ecommerce platform under various traffic conditions.

## 4. Setting Up The Project

### 1. Installing Node.js

1. **Download and Install Node.js**:

   - Visit [nodejs.org](https://nodejs.org) to download and install Node.js.

2. **Verify Installation**:
   - Open your terminal and check the installed versions of Node.js and npm:
     ```bash
     node -v
     npm -v
     ```

### 2. MongoDB Setup

1. **Download and Install MongoDB Compass**:

   - Visit [MongoDB Compass](https://www.mongodb.com/products/tools/compass) and download and install MongoDB Compass for your operating system.

2. **Create a New Cluster**:

   - Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
   - After logging in, create a project and within that project deploy a free cluster.

3. **Configure Database Access**:

   - Create a new user for your database (if not alredy done so) in MongoDB Atlas.
   - Navigate to "Database Access" under "Security" and create a new user with the appropriate permissions.

4. **Whitelist IP Address**:

   - Go to "Network Access" under "Security" and whitelist your IP address to allow access from your machine.
   - For example, you could whitelist 0.0.0.0 to allow access from anywhere for ease of use.

5. **Connect to the Database**:

   - In your cluster's page on MongoDB Atlas, click on "Connect" and choose "Compass".
   - Copy the connection string.

6. **Establish Connection with MongoDB Compass**:
   - Open MongoDB Compass on your local machine, paste the connection string (replace the necessary placeholders), and establish a connection to your cluster.

### 3. Application Setup

To download and use the MERN (MongoDB, Express.js, React.js, Node.js) app from GitHub, follow these general steps:

1. **Clone the Repository**

   - Go to the GitHub repository of the MERN app.
   - Click on the "Code" button and copy the URL of the repository.
   - Open your terminal or command prompt.
   - Use the `git clone` command followed by the repository URL to clone the repository to your local machine:
     ```bash
     git clone <repository_url>
     ```
   - Navigate into the cloned directory.

2. **Install Frontend and Backend Dependencies**

   - Run the following command in your project's root directory:

     ```
     npm install && cd client && npm install && cd ..
     ```

3. **Add database connection string to `.env`**

   - Add the connection string copied from MongoDB Atlas to the `.env` file inside the project directory (replace the necessary placeholders):
     ```env
     MONGO_URL = <connection string>
     ```

4. **Adding sample data to database**

   - Download “Sample DB Schema” from Canvas and extract it.
   - In MongoDB Compass, create a database named `test` under your cluster.
   - Add four collections to this database: `categories`, `orders`, `products`, and `users`.
   - Under each collection, click "ADD DATA" and import the respective JSON from the extracted "Sample DB Schema".

5. **Running the Application**
   - Open your web browser.
   - Use `npm run dev` to run the app from root directory, which starts the development server.
   - Navigate to `http://localhost:3000` to access the application.

## 5. Unit Testing with Jest

Unit testing is a crucial aspect of software development aimed at verifying the functionality of individual units or components of a software application. It involves isolating these units and subjecting them to various test scenarios to ensure their correctness.  
Jest is a popular JavaScript testing framework widely used for unit testing. It offers a simple and efficient way to write and execute tests in JavaScript projects.

### Getting Started with Jest

To begin unit testing with Jest in your project, follow these steps:

1. **Install Jest**:  
   Use your preferred package manager to install Jest. For instance, with npm:

   ```bash
   npm install --save-dev jest

   ```

2. **Write Tests**  
   Create test files for your components or units where you define test cases to evaluate their behaviour.

3. **Run Tests**  
   Execute your tests using Jest to ensure that your components meet the expected behaviour.  
   You can run the tests by using the following command in the root of the directory:

   - **Frontend tests**

     ```bash
     npm run test:frontend
     ```

   - **Backend tests**

     ```bash
     npm run test:backend
     ```

   - **All the tests**
     ```bash
     npm run test
     ```
