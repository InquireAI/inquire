interface IProps<T> {
  data: T[];
  renderChild: (props: T) => React.ReactNode;
}

const List = <T,>({ data, renderChild }: IProps<T>) => {
  return (
    <div className="overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {data.map((item, idx) => (
          <li key={idx}>{renderChild(item)}</li>
        ))}
      </ul>
    </div>
  );
};

export default List;
