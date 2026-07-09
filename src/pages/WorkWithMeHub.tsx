import { Navigate } from 'react-router-dom';

/* WS15 — the hub-as-chooser is retired (WWM_REDESIGN_PROMPT.md hardened plan).
   The two audience surfaces (/work-with-me/teams + /work-with-me/investors) are the
   real, crawlable pages. Bare /work-with-me is a light redirect to the teams surface
   — NOT a separate chooser page, and NOT a blanket 301 that kills the audience URLs. */
export default function WorkWithMeHub() {
  return <Navigate to="/work-with-me/teams" replace />;
}
