"use client";

import { Droppable, DroppableProps } from "react-beautiful-dnd";
import React from "react";

type SafeDroppableProps = Omit<DroppableProps, "isDropDisabled" | "isCombineEnabled" | "ignoreContainerClipping"> & {
  isDropDisabled?: boolean;
  isCombineEnabled?: boolean;
  ignoreContainerClipping?: boolean;
};

export const SafeDroppable: React.FC<SafeDroppableProps> = ({
  isDropDisabled = false,
  isCombineEnabled = false,
  ignoreContainerClipping = false,
  children,
  ...rest
}) => {
  return (
    <Droppable
      isDropDisabled={!!isDropDisabled}
      isCombineEnabled={!!isCombineEnabled}
      ignoreContainerClipping={!!ignoreContainerClipping}
      {...rest}
    >
      {children}
    </Droppable>
  );
};
