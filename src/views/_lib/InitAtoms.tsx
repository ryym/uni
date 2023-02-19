import { useHydrateAtoms } from "jotai/utils";
import { ReactElement, ReactNode } from "react";

export type InitAtomsProps = {
  readonly initialValues: Parameters<typeof useHydrateAtoms>[0];
  readonly children: ReactNode;
};

export function InitAtoms(props: InitAtomsProps): ReactElement {
  useHydrateAtoms(props.initialValues);
  return <>{props.children}</>;
}
