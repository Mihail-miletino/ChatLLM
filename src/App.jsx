import {useState} from "react";
import "./App.css";

export default function App(){

  const [messages, setMessages] = useState([]);
  const [stream, setStream] = useState("");
  const [message, setMessage] = useState("");

  async function request(text){
    const userMessage = { "role": "user", "content": text};
    await setMessages((m) => {
      m.push(userMessage);
      return m;
    });

    const body = {
      model: "qwen2.5-coder:3b",
      messages: messages,
      stream: true
    };
    try{
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      const headers = response.headers.values();
      let header = headers.next();
      while (!header.done){
        console.log(header);
        header = headers.next();
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let data = await reader.read();
      let res = "";
      setStream("assistant: ");
      while (!data.done){
        data = decoder.decode(data.value, {stream: true});
        data = data.split("data: ")[1];
        data = JSON.parse(data);
        if (data.choices[0].delta.content){
          console.log(data.choices[0].delta.content);
          res += data.choices[0].delta.content;
          setStream((st) => st += data.choices[0].delta.content);
        }
        data = await reader.read();
      }
      const llmMessage = { "role": "assistant", "content": res};
      setMessages((m) => {
        m.push(llmMessage);
        return m;
      });
      setStream("");
    } catch(err){
      console.log(`Error: ${err.message}`);
    }
  }

  function changeMessageHandler(event){
    setMessage(event.target.value);
  }

  function clickSendMessageHandler(event){
    request(message);
    setMessage("");
  }

  return (
      <>
        <div className={"container"}>
          <div style={{flex: "1 1 auto"}}>
            <h1>Chat</h1>
            <ul className={"list"}>{
              messages.map((mess, index) => {
                return (
                    <li style={{
                      alignSelf: (mess.role === "user") ? "flex-end" : "flex-start",
                      borderRadius: "5px",
                      padding: "5px 10px 5px 10px",
                      background: "teal",
                      color: "white"
                    }} key={index}>{mess.role + ": " + mess.content}</li>
                );
              })
            }</ul>
            <p>{stream}</p>
          </div>
          <div style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center"
          }}>
            <div style={{width: "20%", height: "60px", borderRadius: "5px", margin: "20px"}}>
              <input style={{width: "100%", height: "100%", borderRadius: "5px"}} placeholder={"Enter message: "} onChange={changeMessageHandler} type="text" value={message}/>
            </div>
            <div onClick={clickSendMessageHandler} style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: "blue"
            }}></div>
          </div>
        </div>
      </>
  );
}
