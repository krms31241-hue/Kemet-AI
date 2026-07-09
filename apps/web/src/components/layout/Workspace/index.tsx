import Hero from "../../dashboard/Hero";
import Stats from "../../dashboard/Stats";
import Workflow from "../../dashboard/Workflow";
import Editor from "../../dashboard/Editor";
import Preview from "../../dashboard/Preview";
import RightPanel from "../../dashboard/RightPanel";

import styles from "./Workspace.module.css";

export default function Workspace() {
  return (
    <section className={styles.workspace}>
      <div className={styles.main}>
        <Hero />

        <Stats />

        <div className={styles.bottom}>
          <div className={styles.left}>
            <Workflow />
            <Editor />
          </div>

          <Preview />
        </div>
      </div>

      <RightPanel />
    </section>
  );
}
