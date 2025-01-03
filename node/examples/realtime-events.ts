import "dotenv/config";
import { Kadoa } from "../src";

const kClientProps: IKadoaProps = {
  teamApiKey: process.env.KADOA_TEAM_API_KEY,
};
const kClient = new Kadoa(kClientProps);

kClient.listen((event) => {
  console.log("event received", event);
});
