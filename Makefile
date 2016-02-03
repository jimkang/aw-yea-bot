HOMEDIR = $(shell pwd)

test:
	node tests/basictests.js

start:
	node responder.js

create-docker-machine:
	docker-machine create --driver virtualbox dev

stop-docker-machine:
	docker-machine stop dev

start-docker-machine:
	docker-machine start dev

# connect-to-docker-machine:
	# eval "$(docker-machine env dev)"

build-docker-image:
	docker build -t jkang/aw-yea-bot .

push-docker-image: build-docker-image
	docker push jkang/aw-yea-bot

run-docker-image:
	docker run -v $(HOMEDIR)/config:/usr/src/app/config \
    -v $(HOMEDIR)/data:/usr/src/app/data \
		jkang/aw-yea-bot make start

pushall: push-docker-image
	git push origin master
