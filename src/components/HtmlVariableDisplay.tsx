import React from 'react';

interface HtmlVariableDisplayProps {
  content: string;
  isEditMode: boolean;
  variableName: string;
}

const HtmlVariableDisplay: React.FC<HtmlVariableDisplayProps> = ({ content, isEditMode, variableName }) => {
  if (isEditMode) {
    return (
      <span className="bg-pink-200">
        {`{{${variableName}}}`}
      </span>
    );
  }

  return (
    <span className="bg-pink-200 block">
      <div dangerouslySetInnerHTML={{ __html: content || 'N/A' }} />
    </span>
  );
};

export default HtmlVariableDisplay;