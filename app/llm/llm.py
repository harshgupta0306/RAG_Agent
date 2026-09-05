import dotenv
from langchain_pollinations import ChatPollinations
# from langchain_core.messages import HumanMessage, SystemMessage

dotenv.load_dotenv()

llm = ChatPollinations(model="llama", temperature=0.7)
# res = llm.invoke([
#     SystemMessage(content="You are a concise assistant."),
#     HumanMessage(content="What is the capital of France?"),
# ])
# print(res.content)
# from pydantic import BaseModel
# from typing import Literal

# class TestOutput(BaseModel):
#     grade: Literal["good", "bad"]
#     feedback: str


# structured_llm = llm.with_structured_output(TestOutput)

# result = structured_llm.invoke(
#     "Say good if 2 + 2 = 4. Give a short explanation."
# )

# print("RESULT:", result)
# print("TYPE:", type(result))