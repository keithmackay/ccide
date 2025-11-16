This is the idea file for a web-based IDE for use with LLMs. It should run in a browser.

**UI/UX**
The webpage has two panels.

The left panel, about 1/3 the width of the screen, has a Header, a Workpane, and a Footer:
- the Header at the top contains two controls:
	- a clickable mode selector to choose between showing Projects, Conversation, or Project Files
	- a clickable 'hide panel' icon that hides the left panel with a slide-shut animation
	- When panel is collapsed, a panel open icon is shown at the left edge of the (now) full-width right panel Header. Clicking that button will restore the left panel with a slide-in animation
- The left panel Workpane fills most of the vertical space on the screen (everything between the short Header at top and short Footer at bottom) and is contextual, based on the chosen mode:
	- Projects mode (default when starting)
		- the Workpane has a Create Project button, a collapsible list of Active Projects, and a collapsible list of Archived Projects
			- The Active Projects list is maintained in the projects subfolder of this project, in the active-projects.md file, and the Archived Projects list is maintained in the projects subfolder of this project, in the archived-projects.md
			- clicking 'Create Project' will:
				- ask user for [name]
				- create a new [name] subfolder in the projects folder of this project
				- cwd to the new folder
				- bootstrap the project using the bootstrap slash command
				- switch the pane to Conversation mode, and
				- begin coordinating the conversation workflow with agent ccide-orchestrator-agent
			- The Active Projects list will have a filebox (archive) icon in a column to the right of each filename. Clicking this icon will move the project name from projects/active-projects.md to projects/archived-projects.md and refresh the pane/reload the lists.
			- The Archived Projects list will have an unarchive icon in a column to the right of each filename. Clicking this icon will move the project from projects/archived-projects.md to projects/active-projects.md and refresh the pane/reload the lists.
			- clicking the Active Projects or Archived Projects list header will expand or collapse the corresponding project list as appropriate
			- Clicking a project name in the Active Projects list will load that project (cwd to projects/[name]), switch to Conversation mode, and begin coordinating the conversation workflow with  agent ccide-orchestrator-agent.
	- Conversation mode
		- the left panel Workpane lists the ongoing conversation in a typical scrolling chat window showing user entries and LLM responses, with an entry box at the bottom for the user to enter their chat text
		- the left panel Footer includes a dropdown to select the specific LLM model to use (from the list of registered models in the Settings page, described later in this document), along with showing the size and percentage of used context window in a format like "🧠 86,992 (43%)". For Claude Code models, this can be done with 'npx ccusage@latest'.
	- Project Files mode
		- the left panel Workpane displays the files in the active project in a collapsible tree view
		- if a filename is clicked in the tree view, it is highlighted and the name in displayed in the right panel Header. If it is a filetype with human-interpretable content, its content is displayed in the right panel Workpane.
		- the left panel Footer is hidden to allow more real estate for the tree view
- The right panel (rest of the screen) has three parts:
	- a small Header that lists the current workflow step or filename
	- a Workpane that fills most of the rest of the panel which displays whatever is appropriate for the given context
		- The right panel Workpane is contextual. If in conversation mode, any file being worked on will be displayed into the Workpane after changes are completed.
	- a Footer that fills with buttons showing all available files that can be displayed in the right panel Workpane for the current step
  
**SETTINGS**
A settings page should be available with account, LLM, and About sections. The LLM section should allow user to add LLM API keys and account details, which should be stored encrypted in config/settings.md. The LLM models configured here will appear in the left panel Footer dropdown.

**ANALYTICS**
Every message entered into the agent conversation and every return message from the LLM should be stored into a local free database. This message traffic should be tagged with the active project id.

An analytics page should be available from a main hamburger menu that shows consolidated details from the analytics database.

**ADDING AGENTS**
The tool should have a hamburger menu option for "Add Agents/Skills" that takes user to a screen providing the ability to install plugins/skills/agents from https://www.aitmpl.com/. Agents that are selected should be loaded into the agents subfolder for this project.

**DEFAULT COMMANDS**
The system by default should have the following slash commands in the commands subfolder in this project. They can be found and copied from either my ~/.claude/commands folder or my ~/Projects/agents/commands folder:
* /bootstrap
* /create_handoff
* /resume_handoff
* /retro
* /retro-apply

**DEFAULT AGENTS**
A number of agents need to be created and included in the agents subfolder for this project. Model the agent files architecture (protocols, agent file structure, etc.) on the agents found in the ~/Projects/agents project.

The general idea for each agent to be built can be found in [name]-idea.md files in the docs/specs folder for this project. Create an agent in the agents subfolder that handles the idea described in each of those files. If an existing agent in the agents/examples folder is similar, copy that agent to the agents subofolder, rename the copy to the name indicated in the idea file, and modify it to use the preferred architecture outlined above and to include any additional functionality that would be appropriate for its role.

Use existing agents on this machine to build these agent (for instance, see the agents in folder Projects/agents and Projects/bmad-method/BMAD-METHOD/dist/agents and Projects/anthropic-skills/skills and Projects/whisperers-marketplace), but optimize the agents for the workflow described in ProjectWorkflow.md
