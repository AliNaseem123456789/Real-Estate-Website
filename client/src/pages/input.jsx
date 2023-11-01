import React, { useState } from 'react';
import axios from 'axios';
import building from './imarat.svg';
import { faBed, faBath,faExpand, faHome, faDollarSign ,faBuilding} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FaBed, FaBath,FaHeart } from 'react-icons/fa';

export default function InputForm() {
  const [formData, setFormData] = useState({
        type:'',
        action:'',
        size:'',
        title: '',
        city: '',
        address: '',
        description: '',
        price: '',
        bedroom:'',
        bathroom:'',
        publisher_name:'',
        publisher_num:'',
        publisher_email:'',
  });

  const [image, setImage] = useState(null);
  const [action, setAction] = useState(null);
  const [type, setType] = useState(null);

  const handleImageChange = (event) => {
    const selectedImage = event.target.files[0];
    setImage(selectedImage);
  };

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleButtonClick = (selectedAction) => {
    setAction(selectedAction);
  };
  const handleButtonclicktype = (selectedtype) => {
    setType(selectedtype);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/submitForm', {
        ...formData,
        action,
        type,
      });
      setFormData({
        type:'',
        action :'',
        size:'',
        title: '',
        city: '',
        address: '',
        description: '',
        price: '',
        bedroom:'',
        bathroom:'',
        publisher_name:'',
        publisher_num:'',
        publisher_email:'',
      });
      setAction(null);
      setType(null);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    
    <div className='bg-white my-[-30px]'>
      <div className="flex items-center justify-center mt-16 bg-white">
    <div className="w-[1100px] h-200 bg-red-500 text-white border-red-500 border-4 rounded-xl md:h-50">
      <p className="mt-8 flex items-center justify-center text-4xl font-bold">
        Upload your property details
      </p>
      <img src={building} alt="Building" className="lg:w-[600px] h-[300px] ml-[700px] sm:w-[200px] h-[230px] ml-[720px] mx-auto mt-[-120px]"
      />
    </div>
  </div>
    <div className='mx-20 my-10'>
      
      <form onSubmit={handleSubmit} className='mb-32'>
        <div  className='text-[18px] font-semibold text-gray-600'>
          What do you want to do?<br></br>
          <button type="button" onClick={() => handleButtonClick('rent')}
            className={`font-semibold text-sm px-4 my-2 mx-4 h-[40px] border-2 rounded-lg  ${action === 'rent' ? 'border-orange-700' : ''}`}>
            <FontAwesomeIcon icon={faHome}/> Rent
          </button>
          <button type="button" onClick={() => handleButtonClick('sell')}
            className={`text-[15px] font-semibold text-sm px-4 my-2   mx-4 h-[40px] border-2 rounded-lg  ${action === 'sell' ? 'border-orange-700' : ''}`}>
            <FontAwesomeIcon icon={faDollarSign}/> Sell
          </button>
          <br />
        </div>
        <p  className='text-[18px] font-semibold text-gray-600'>
        what kind of property do you have?
        </p>
        <div>
          <button type="button" onClick={() => handleButtonclicktype('Residential')}
            className={`font-semibold text-sm px-4 py-2 my-2  border-2 rounded-lg   ${type === 'Residential' ? 'border-orange-700' : ''}`}>
           <FontAwesomeIcon icon={faHome}/> Residential
          </button>
          <button type="button" onClick={() => handleButtonclicktype('Commercial')}
            className={`font-semibold text-sm px-4 py-2 my-2 mx-6 border-2 rounded-lg ${type === 'Commercial' ? 'border-orange-700' : ''}`}>
           <FontAwesomeIcon icon={faBuilding}/> Commerecial
          </button>
          <button type="button" onClick={() => handleButtonclicktype('Plot')}
            className={`font-semibold text-sm font-gray px-4 py-2 border-2 rounded-lg my-2 ${type === 'Plot' ? 'border-orange-700' : ''}`}>
            Plot
          </button>
          <br />
        </div>
        <div className=' text-[18px] font-semibold text-gray-600'> Which city is your property in?<br></br>
          <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder='Select your city'
           className="text-[13px] font-semibold my-3 w-[400px] h-10  px-3 border border-gray-500-p3 rounded-md text-gray-800 leading-tight focus:outline-none focus:shadow-outline" /><br></br>
          <br />
          Which area is your property in?<br></br>
          <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder='Address,Block,Street,city etc'
           className="text-[13px] my-3 px-3 w-[400px] h-10 border border-gray-500-p3 rounded-md text-gray-800 leading-tight focus:outline-none focus:shadow-outline"
          /><br></br>
          <br />
          What is the size of your property?<br></br> 
          <input type="text" name="size" value={formData.size} onChange={handleChange} placeholder='0'
            className="text-[13px] font-light my-3 w-[400px] h-10  px-3 border border-gray-500-p3 rounded-md text-gray-800 leading-tight focus:outline-none focus:shadow-outline" /><br></br>
          <br />
          Name your Property<br></br>
          <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder='Name your Property'
           className="text-[13px] my-5 w-[400px] h-10  px-3 border border-gray-500-p3 rounded-md text-gray-800 leading-tight focus:outline-none focus:shadow-outline" /><br></br>
          <br />
      
          What is the asking price?<br></br>
          <input type="text" name="price" value={formData.price} onChange={handleChange}  
           className="text-[13px] my-3 w-[400px] h-10  px-3 border border-gray-500-p3 rounded-md text-gray-800 leading-tight focus:outline-none focus:shadow-outline"/>
           <br></br>     
          How many bedroom does it have?<br></br>
          <input type="number" name="bedroom" placeholder='No of Bedrooms'  value={formData.bedroom} onChange={handleChange}  
           className="text-[13px] my-3 w-[400px] h-10  px-3 border border-gray-500-p3 rounded-md text-gray-800 leading-tight focus:outline-none focus:shadow-outline"/>
           <br></br>
          How many bathroom does it have?<br></br>
          <input type="number" name="bathroom" placeholder='No of Bathrooms' value={formData.bathroom} onChange={handleChange} 
           className="text-[13px] my-3 w-[400px] h-10  px-3 border border-gray-500-p3 rounded-md text-gray-800 leading-tight focus:outline-none focus:shadow-outline"/>
          <br />
          What do you love about your property?<br></br>
          <textarea name="description" value={formData.description} onChange={handleChange}
           className="text-[13px] my-3 w-[400px] h-[100px]  px-3 border border-gray-500-p3 rounded-md text-gray-400 leading-tight focus:outline-none focus:shadow-outline"/>
        </div>
        <div>
            <input  type="file" name="image" accept="image/*" onChange={handleImageChange} placeholder='Select an Image' />
          <br />
         
          </div>
          <br />
          <div className=' text-[18px] font-semibold text-gray-600'>
            Tell us how to contact you?<br></br>
          <input type="number" name="publisher_num" placeholder='+92'  value={formData.publisher_num} onChange={handleChange}  
          
        className="text-[13px] my-3 w-[400px] h-10  px-3 border border-gray-500-p3 rounded-md text-gray-800 leading-tight focus:outline-none focus:shadow-outline"/>
       <br></br>
       What is your Name?<br></br>
       <input type="text" name="publisher_name" placeholder='what is your name'  value={formData.publisher_name} onChange={handleChange}  
           className="text-[13px] my-3 w-[400px] h-10  px-3 border border-gray-500-p3 rounded-md text-gray-800 leading-tight focus:outline-none focus:shadow-outline"/>
        
        <br></br>
       Write your Email<br></br>
       <input type="Email" name="publisher_email" placeholder='what is your name'  value={formData.publisher_email} onChange={handleChange}  
           className="text-[13px] my-3 w-[400px] h-10  px-3 border border-gray-500-p3 rounded-md text-gray-800 leading-tight focus:outline-none focus:shadow-outline"/>
        

        <button type="submit">Submit</button>
        </div>
       

      </form>
    </div>
    </div>
  );
}





















// import React, { useState } from 'react';
// import axios from 'axios';

// export default function Input() {
//   const [formdata, setFormdata] = useState({
//     city: '',
//     address: '',
//     price: '',
//   });

//   const handleChange = (event) => {
//     setFormdata({ ...formdata, [event.target.name]: event.target.value });
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     try {
//         const response = await axios.post('http://localhost:3001/Form', formdata);

//       console.log('Form submitted:', response.data);
//     } catch (error) {
//       console.error('Error submitting form:', error);
//     }
//   };

//   return (
//     <div>
//       <form onSubmit={handleSubmit}>
//         <label>
//           Which city is your property in?<br />
//           <input type="text" name="city" value={formdata.city} onChange={handleChange} /><br /><br />
//         </label>
//         <label>
//           Address of your Property<br />
//           <input type="text" name="address" value={formdata.address} onChange={handleChange} /><br />
//         </label>
//         <label>
//           What is the asking price?<br />
//           <input type="text" name="price" value={formdata.price} onChange={handleChange} /><br />
//         </label>
//         <label>
//           Upload Image:<br />
//           <input type="file" name="image" placeholder="Upload Image" /><br />
//         </label>
//         <button type="submit">Submit</button><br />
//       </form>
//     </div>
//   );
// }