import assets from "../../assets/assets";


const MultiModel = () => {
  const model_object = [
    {
      icon: assets.message_icon, // Assuming assets.message_icon is a valid path to an icon
      name: "Gemini",
    },
    {
      icon: assets.message_icon, // You can replace this with different icons if available
      name: "Aries",
    },
    {
      icon: assets.message_icon,
      name: "Taurus",
    },
    {
      icon: assets.message_icon,
      name: "Leo",
    },
    {
      icon: assets.message_icon,
      name: "Virgo",
    },
  ];
  return (
    <div className="model-display">
      {model_object.map((model, index) => {
        return (
          <div key={index} className="model-card">
            <img src={model.icon} alt={model.name} />
            <p>{model.name}</p>
          </div>
        );
      })}
    </div>
  );
};

export default MultiModel;
