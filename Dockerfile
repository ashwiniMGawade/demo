FROM node:8.11.4

# Install gem sass for grunt-contrib-sass
RUN apt-get update
RUN apt-get install -y build-essential
RUN apt-get install -y ruby ruby-dev libkrb5-dev
RUN apt-get install -y net-tools dnsutils vim-tiny
RUN gem install sass

WORKDIR /home/mean

# Install Mean.JS Prerequisites
RUN npm install -g grunt-cli
RUN npm install -g bower

# Install Mean.JS packages
ADD package.json /home/mean/package.json
RUN npm install

# Manually trigger bower. Why doesnt this work via npm install?
ADD .bowerrc /home/mean/.bowerrc
ADD bower.json /home/mean/bower.json
RUN bower install --config.interactive=false --allow-root

# Make everything available for start
ADD . /home/mean

# Add nse user and group
RUN groupadd -g 20001 nse && useradd -u 20001 -g nse -c "NetApp Service Engine" -s /bin/false nse 

# Set development environment as default
#ENV NODE_ENV development

# Ports 3000 (dev/http), 3001 (test), 8443 (prod/https) for server
# Port 35729 for livereload
#EXPOSE 3000 8443 35729
EXPOSE 3000 8443
CMD ["npm", "start"]

