import React from "react";
import MorphingCircleBase from "./MorphingCircle"; // this file

const MorphingCircle = React.memo(MorphingCircleBase, (prevProps, nextProps) => {
  return (
    prevProps.size === nextProps.size &&
    prevProps.text === nextProps.text &&
    prevProps.textColor === nextProps.textColor &&
    prevProps.textSize === nextProps.textSize &&
    JSON.stringify(prevProps.colors) === JSON.stringify(nextProps.colors)
  );
});

export default MorphingCircle;
