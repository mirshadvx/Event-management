import React, { useRef } from "react";
import { Upload } from "lucide-react";

const FileInput = ({ onImageSelected, label }) => {
  const inputRef = useRef();

  const handleOnChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]);
      reader.onload = () => onImageSelected(reader.result);
    }
  };

  const onChooseImg = () => inputRef.current.click();

  return (
    <div className="text-center">
      <input type="file" accept="image/*" ref={inputRef} onChange={handleOnChange} className="hidden" />
      <button type="button" onClick={onChooseImg} className="flex flex-col items-center justify-center">
        <Upload className="mx-auto text-green-500" />
        <p className="text-gray-400 mt-2">{label}</p>
      </button>
    </div>
  );
};

export default FileInput;