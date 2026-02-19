import Layout from '../../components/Layout';
import AdminMenu from '../../components/AdminMenu';

const Users = () => {
  return (
    <Layout title={"Dashboard - All Users"} data-testid="admin-users-layout">
      <div className="container-fluid m-3 p-3" data-testid="admin-users-container">
        <div className="row" data-testid="admin-users-row">
          <div className="col-md-3" data-testid="admin-users-sidebar">
            <AdminMenu />
          </div>
          <div className="col-md-9" data-testid="admin-users-main">
            <h1>All Users</h1>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Users;
