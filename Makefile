HOMEDIR = $(shell pwd)
SMUSER = noderunner
PRIVUSER = root
SERVER = sprigot-droplet
SSHCMD = ssh $(SMUSER)@$(SERVER)
PROJECTNAME = aw-yea-bot
APPDIR = /var/www/$(PROJECTNAME)

pushall: sync  set-permissions restart-remote
	git push origin master

sync:
	rsync -a $(HOMEDIR) $(SMUSER)@$(SERVER):/var/www/ --exclude node_modules/ --exclude data/
	ssh $(SMUSER)@$(SERVER) "cd /var/www/$(PROJECTNAME) && npm install"

set-permissions:
	$(SSHCMD) "chmod +x $(APPDIR)/aw-yea-responder.js && \
	chmod 777 -R $(APPDIR)/data/aw-yea-responses.db"

update-remote: sync set-permissions restart-remote

# You need a user with privileges to write to /etc/systemd and to run systemctl for 
# these targets.
restart-remote:
	ssh $(PRIVUSER)@$(SERVER) "service $(PROJECTNAME) restart"

install-service:
	ssh $(PRIVUSER)@$(SERVER) "cp $(APPDIR)/$(PROJECTNAME).service /etc/systemd/system && \
	systemctl enable aw-yea-bot"
