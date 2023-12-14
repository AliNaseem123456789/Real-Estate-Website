import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Signin from './pages/Signin'
import Signup from './pages/Signup'
import About from './pages/About'
import Profile from './pages/Profile'
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import CreateListing from './pages/Createlisting';
import InputForm from './pages/input';
import Complete from './pages/complete';
import Action from './pages/Action';
// import Home from './pages/Home3';

export default function App() {
  return <BrowserRouter>
  <Header/>
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/sign-in' element={<Signin />} />
      <Route path='/sign-up' element={<Signup />} />
      <Route path='/about' element={<About />} />
      <Route path='/actions' element={<Action />} />
      <Route path='/input' element={<InputForm/>} />
      <Route path='/properties/:id' element={<Complete />} />
      
      <Route element={<PrivateRoute />}>
        <Route path='/profile' element={<Profile />} />
        <Route path='/create-listing' element={<CreateListing />} />
      </Route>
    </Routes>
  </BrowserRouter>
}


// const mongoose = require('mongoose');
// const uri = "mongodb+srv://alinaseem20021021_db_user:<db_password>@cluster0.j16gmhw.mongodb.net/?appName=Cluster0";
// const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };
// async function run() {
//   try {
//     // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
//     await mongoose.connect(uri, clientOptions);
//     await mongoose.connection.db.admin().command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await mongoose.disconnect();
//   }
// }
// run().catch(console.dir);