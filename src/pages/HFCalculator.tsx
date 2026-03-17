import { Outlet, Link, useLocation } from "react-router-dom";
import {CATEGORIES} from '../utils/Categories'


const HFCalculator = () => {
  const location = useLocation();

  return (
    <>
      <Outlet />
    </>
  );
};

export default HFCalculator;
