import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, firestore as db, auth } from "../../firebaseApp";

interface House {
  id: string;
  title: string;
  description: string;
  price: number;
  type: "rent" | "sale";
  location: string;
  images: string[];
  likes: number;
  features: string[];
  bedrooms: number;
  bathrooms: number;
  size: number;
  createdAt: any;
  updatedAt: any;
  ownerId: string;
  ownerName: string;
  isActive: boolean;
  isFeatured: boolean;
  latitude: number;
  longitude: number;
}

const Landlord = () => {
  const [houses, setHouses] = useState<House[]>([]);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);

  const [newHouse, setNewHouse] = useState<Partial<House>>({
    title: "",
    description: "",
    price: 0,
    type: "sale",
    location: "",
    images: [],
    likes: 0,
    features: [],
    bedrooms: 0,
    bathrooms: 0,
    size: 0,
    isActive: true,
    isFeatured: false,
    longitude: 0,
    latitude: 0,
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "houses"), (snapshot) => {
      setHouses(
        snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as House)
        )
      );
    });
    return () => unsubscribe();
  }, []);

  const uploadImages = async (files: FileList) => {
    const uploadPromises = Array.from(files).map(async (file) => {
      const path = `houses/${auth.currentUser?.uid}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    });

    return Promise.all(uploadPromises);
  };

  const handleAddHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("Please sign in to list a property");
      return;
    }

    if (!imageFiles || !newHouse.title || !newHouse.location) {
      alert("Please fill in all required fields and upload at least one image");
      return;
    }

    setLoading(true);
    try {
      // Upload images and get URLs
      const imageUrls = await uploadImages(imageFiles);

      // Add document to Firestore
      const docRef = await addDoc(collection(db, "houses"), {
        ...newHouse,
        images: imageUrls,
        ownerId: auth.currentUser.uid,
        ownerName: auth.currentUser.displayName || "Anonymous",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Reset form
      setNewHouse({
        title: "",
        description: "",
        price: 0,
        type: "sale",
        location: "",
        images: [],
        likes: 0,
        features: [],
        bedrooms: 0,
        bathrooms: 0,
        size: 0,
        isActive: true,
        isFeatured: false,
      });
      setImageFiles(null);

      // Reset file input
      const fileInput = document.getElementById("images") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Error adding house: ", error);
      alert("Failed to add house listing");
    }
    setLoading(false);
  };

  const handleDeleteHouse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    try {
      await deleteDoc(doc(db, "houses", id));
    } catch (error) {
      console.error("Error deleting house: ", error);
      alert("Failed to delete house listing");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Add New Property</h3>

      <form onSubmit={handleAddHouse} className="mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Property Title"
            value={newHouse.title}
            onChange={(e) =>
              setNewHouse({ ...newHouse, title: e.target.value })
            }
            className="p-2 border rounded focus:ring-2 focus:ring-teal-500"
            required
          />
          <input
            type="text"
            placeholder="Location"
            value={newHouse.location}
            onChange={(e) =>
              setNewHouse({ ...newHouse, location: e.target.value })
            }
            className="p-2 border rounded focus:ring-2 focus:ring-teal-500"
            required
          />

          <input
            type="number"
            placeholder="Latitude"
            step="0.0000001"
            value={newHouse.latitude || ""}
            onChange={(e) =>
              setNewHouse({ ...newHouse, latitude: parseFloat(e.target.value) })
            }
            className="p-2 border rounded focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="number"
            placeholder="Longitude"
            step="0.0000001"
            value={newHouse.longitude || ""}
            onChange={(e) =>
              setNewHouse({
                ...newHouse,
                longitude: parseFloat(e.target.value),
              })
            }
            className="p-2 border rounded focus:ring-2 focus:ring-teal-500"
          />

          <input
            type="number"
            placeholder="Price"
            value={newHouse.price || ""}
            onChange={(e) =>
              setNewHouse({ ...newHouse, price: parseFloat(e.target.value) })
            }
            className="p-2 border rounded focus:ring-2 focus:ring-teal-500"
            required
          />
          <select
            value={newHouse.type}
            onChange={(e) =>
              setNewHouse({
                ...newHouse,
                type: e.target.value as "rent" | "sale",
              })
            }
            className="p-2 border rounded focus:ring-2 focus:ring-teal-500"
          >
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
        </div>

        <textarea
          placeholder="Description"
          value={newHouse.description}
          onChange={(e) =>
            setNewHouse({ ...newHouse, description: e.target.value })
          }
          className="w-full p-2 border rounded focus:ring-2 focus:ring-teal-500"
          rows={4}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="number"
            placeholder="Bedrooms"
            value={newHouse.bedrooms || ""}
            onChange={(e) =>
              setNewHouse({ ...newHouse, bedrooms: parseInt(e.target.value) })
            }
            className="p-2 border rounded focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="number"
            placeholder="Bathrooms"
            value={newHouse.bathrooms || ""}
            onChange={(e) =>
              setNewHouse({ ...newHouse, bathrooms: parseInt(e.target.value) })
            }
            className="p-2 border rounded focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="number"
            placeholder="Size (sq ft/m)"
            value={newHouse.size || ""}
            onChange={(e) =>
              setNewHouse({ ...newHouse, size: parseInt(e.target.value) })
            }
            className="p-2 border rounded focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <input
          type="text"
          placeholder="Features (comma-separated)"
          onChange={(e) =>
            setNewHouse({
              ...newHouse,
              features: e.target.value
                .split(",")
                .map((feature) => feature.trim()),
            })
          }
          className="w-full p-2 border rounded focus:ring-2 focus:ring-teal-500"
        />

        <div>
          <label className="block text-sm font-medium mb-1">
            Property Images
          </label>
          <input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImageFiles(e.target.files)}
            className="w-full"
            required
          />
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={newHouse.isActive}
              onChange={(e) =>
                setNewHouse({ ...newHouse, isActive: e.target.checked })
              }
              className="mr-2"
            />
            Active
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={newHouse.isFeatured}
              onChange={(e) =>
                setNewHouse({ ...newHouse, isFeatured: e.target.checked })
              }
              className="mr-2"
            />
            Featured
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded transition duration-200 disabled:opacity-50"
        >
          {loading ? "Adding Property..." : "Add Property"}
        </button>
      </form>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Your Properties</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {houses.map((house) => (
            <div
              key={house.id}
              className="border rounded-lg p-4 hover:shadow-md transition duration-200"
            >
              {house.images[0] && (
                <img
                  src={house.images[0]}
                  alt={house.title}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
              )}
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-lg">{house.title}</h4>
                <span className="font-medium text-teal-600">
                  ${house.price.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-600">{house.location}</p>
              <p className="text-sm text-gray-600">
                {house.bedrooms} beds • {house.bathrooms} baths • {house.size}{" "}
                sq ft
              </p>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => handleDeleteHouse(house.id)}
                  className="text-red-500 hover:text-red-700 font-medium transition duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Landlord;



// generate an images of a house/modern style not futuristic to add to house listings on my website, do another one