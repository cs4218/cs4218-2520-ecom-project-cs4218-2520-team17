import { useState, useEffect } from "react";
import AdminMenu from "../../components/AdminMenu";
import Layout from "./../../components/Layout";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const Products = () => {
  const [products, setProducts] = useState([]);

  // lifecycle method
  useEffect(() => {
    const getAllProducts = async () => {
      try {
        const { data } = await axios.get("/api/v1/product/get-product");
        setProducts(data.products);
      } catch (error) {
        console.error(error);
        toast.error("Something Went Wrong");
      }
    };

    getAllProducts();
  }, []);

  return (
    <Layout>
      <div className="row" data-testid="admin-products-container">
        <div className="col-md-3" data-testid="admin-products-menu-col">
          <AdminMenu />
        </div>
        <div className="col-md-9" data-testid="admin-products-main-col">
          <h1 className="text-center">All Products List</h1>
          <div className="d-flex" data-testid="admin-products-list-container">
            {products?.map((p) => (
              <Link
                key={p._id}
                to={`/dashboard/admin/product/${p.slug}`}
                className="product-link"
              >
                <div className="card m-2" style={{ width: "18rem" }} data-testid="admin-product-card">
                  <img
                    src={`/api/v1/product/product-photo/${p._id}`}
                    className="card-img-top"
                    alt={p.name}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{p.name}</h5>
                    <p className="card-text">{p.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;