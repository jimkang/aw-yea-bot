FROM jkang/headporters

# cwd is /usr/src/app
# cache package.json (included in .) and node_modules to speed up builds
ADD package.json package.json
RUN npm install

# Add source files
ADD . .
