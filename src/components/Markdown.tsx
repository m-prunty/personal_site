import ReactMarkdown from "react-markdown";
import { useEffect, useState } from "react";
import Axios from "axios";

interface MDRenderProps {
  filename: string;
}

export const MDRender = (props: MDRenderProps) => {
  const [md, setMd] = useState<string>("");

  useEffect(() => {
    Axios.get<string>(props.filename).then((res) => {
      setMd(res.data);
    });
  }, [props.filename]);

  return (
    <div>
      <ReactMarkdown children={md} />
    </div>
  );
};
