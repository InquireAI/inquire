type Props = {
  isOn: boolean;
  onComponent: React.ReactElement;
  offComponent: React.ReactElement;
};

const Switch: React.FC<Props> = (props) => {
  if (props.isOn) return props.onComponent;
  else return props.offComponent;
};

export default Switch;
