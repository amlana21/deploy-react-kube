pipeline{
    agent any
    environment{
        REGISTRY_URL=<image_registry_url>
        MODE='DEV'
        AWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY>
        AWS_SECRET_ACCESS_KEY=<AWS_ACCESS_KEY>
        AWS_DEFAULT_REGION="us-east-1"
        EC2KEY=<ssh_key_name>
        KUBEADMCOMMAND=<kubeadm_join_command_for_test_cluster>
        MASTERNODE=<test_cluster_chef_node_name>
        SUBNETID=<test_cluster_subnet_id>
        SGID=<test_cluster_sg_id>
    }

    stages{
        stage('build'){
            when{
               environment name:'MODE',value:'DEV'
            }
            environment {
                IMAGE_CREDS = credentials('gitlabimagereg')
            }
            steps{
                sh 'docker login registry.gitlab.com -u $IMAGE_CREDS_USR -p $IMAGE_CREDS_PSW'
                sh  '''cd codes
                       ls -a
                       docker build --no-cache -t $REGISTRY_URL/custflaskapi:113 -f Dockerfile-api .
                       docker push $REGISTRY_URL/custflaskapi:113
                       docker build --no-cache -t $REGISTRY_URL/reactclient:113 -f Dockerfile-clientV2 .
                       docker push $REGISTRY_URL/reactclient:113''' 
                //-----------------upload kube file to s3--------------------
                sh '''cd Kube_Yamls
                      aws s3 cp ReactappKubeV2_tmp.yml s3://kubefiles-ac/reactappkube-$BUILD_NUMBER-1.yml
                    '''        
            }
            post{
                failure{
                    //slack step
                    slackSend color: "bad", message: "Build#: $BUILD_NUMBER: failure in building the images.aborting"
                }
                success{
                    echo 'this is a success'
                     //slack step
                     slackSend color: "good", message: "Build#: $BUILD_NUMBER: successfully built the images and pushed to registry"
                }
            }

        }
        stage('launch node'){
            when{
                environment name:'MODE',value:'DEV'
            }
            steps{
                script {
                    env.STACKID = sh(label:'',script:"aws cloudformation create-stack --stack-name kubenode-$BUILD_NUMBER --template-body file://$PWD/workspace/${currentBuild.projectName}/codes/deploy_ec2_network_v1_kube_nodeV1.json --parameters ParameterKey=KeyP,ParameterValue=${env.EC2KEY} ParameterKey=InstanceType,ParameterValue=t2.micro ParameterKey=SecurityGrpId,ParameterValue=${env.SGID} ParameterKey=SubnetIdVal,ParameterValue=${env.SUBNETID} --query StackId",returnStdout: true).trim()
                    env.STACKSTATUS=sh(label:'',script:"aws cloudformation describe-stacks --stack-name ${env.STACKID} --query Stacks[0].StackStatus",returnStdout: true).trim()
                        while("${env.STACKSTATUS}"=='"CREATE_IN_PROGRESS"'){
                            sleep(20)
                            env.STACKSTATUS=sh(label:'',script:"aws cloudformation describe-stacks --stack-name ${env.STACKID} --query Stacks[0].StackStatus",returnStdout: true).trim()
                        }
                        env.INSTIP=sh(label:'',script:"aws cloudformation describe-stacks --stack-name ${env.STACKID} --query Stacks[0].Outputs[1].OutputValue",returnStdout: true).trim()
                        env.INSTID=sh(label:'',script:"aws cloudformation describe-stacks --stack-name ${env.STACKID} --query Stacks[0].Outputs[0].OutputValue",returnStdout: true).trim()
                        env.INSTIP=env.INSTIP.replaceAll('"','')
                        env.INSTID=env.INSTID.replaceAll('"','')
                        env.STACKID=env.STACKID.replaceAll('"','')
                    }
            }
            post{
                failure{
                    slackSend color: "bad", message: "Build#: $BUILD_NUMBER: failure in launching the test node.aborting"
                    sh 'aws cloudformation delete-stack --stack-name $STACKID'
                }
                success{      
                     //slack step
                     slackSend color: "good", message: "Build#: $BUILD_NUMBER: a new test node launched"
                }
            }
        }
        stage('bootstrap'){
            sh      '''cd chef_cookbook
                      cd kubenode
                      cd .chef
                      aws s3 cp <s3_for_chef_key> <chef_key_name>
                      aws s3 cp <s3_for_ssh_key> <ssh_key_name>
                      aws s3 cp <s3_for_knife_file> <knife_file_name>
                      cd ..
                      knife bootstrap $INSTIP  --connection-user ubuntu --sudo --yes -i "$PWD/.chef/id_rsa.pem" --node-name kubenode-$BUILD_NUMBER --chef-license accept --run-list "role[kubenode]"
                      knife ssh name:kubenode-$BUILD_NUMBER "$KUBEADMCOMMAND" --ssh-user ubuntu -i "$PWD/.chef/id_rsa.pem" --attribute cloud.public_hostname'''
            }
            post{
                success{
                    slackSend color: "good", message: "Build#: $BUILD_NUMBER: Test node bootstrapped and added to the cluster"
                }
                failure{
                    //slack step
                    slackSend color: "bad", message: "Build#: $BUILD_NUMBER: failure in bootstrapping the node or adding to cluster.aborting"
                    sh 'aws cloudformation delete-stack --stack-name $STACKID'
                }
            }
        }
        stage('deploy to test'){
            environment{
                KUBEFILECMD="aws s3 cp s3://kubefiles-ac/reactappkube-$BUILD_NUMBER-1.yml /tmp/reactappkube-$BUILD_NUMBER-1.yml"
                KUBEDEPLOYCMD="kubectl apply -f /tmp/reactappkube-$BUILD_NUMBER-1.yml"
            }
            steps{
                sh '''cd chef_cookbook
                      cd kubenode
                      knife ssh name:$MASTERNODE "$KUBEFILECMD" --ssh-user ubuntu -i "$PWD/.chef/id_rsa.pem" --attribute cloud.public_hostname
                      knife ssh name:$MASTERNODE "$KUBEDEPLOYCMD" --ssh-user ubuntu -i "$PWD/.chef/id_rsa.pem" --attribute cloud.public_hostname'''
                      
            }
            post{
                success{
                    slackSend color: "good", message: "Build#: $BUILD_NUMBER: Deployment completed on test node. URL to access: http://$INSTIP"
                }
                failure{
                    slackSend color: "bad", message: "Build#: $BUILD_NUMBER: deployment to test failed.aborting"
                    sh 'aws cloudformation delete-stack --stack-name $STACKID'
                }
            }

        }
        
        stage('pause for testing'){
            environment{
                KUBEDELCMD="kubectl delete -f /tmp/reactappkube-$BUILD_NUMBER-1.yml"
            }
            steps{
                timeout(time: 10,unit: 'HOURS'){
                input(
                message:'testing completed?',
                ok:'yes'
                )
                }
                echo 'ok moving to cleanup'
            }
            post{
                success{
                    //slack step
                    slackSend color: "good", message: "Build#: $BUILD_NUMBER: Testing passed"
                }
                aborted{
                    sh '''cd chef_cookbook
                      cd kubenode
                      knife ssh name:$MASTERNODE "$KUBEDELCMD" --ssh-user ubuntu -i "$PWD/.chef/id_rsa.pem" --attribute cloud.public_hostname'''
                    //slack step
                    slackSend color: "bad", message: "Build#: $BUILD_NUMBER: Testing failed for the change.Check the issues.Moving to cleanup"
                    sh 'aws cloudformation delete-stack --stack-name $STACKID'
                }
            }
        }
        stage('cleanup'){
            environment{
                KUBEDELCMD="kubectl delete -f /tmp/reactappkube-$BUILD_NUMBER-1.yml"
            }
            steps{
                sh '''cd chef_cookbook
                      cd kubenode
                      knife ssh name:$MASTERNODE "$KUBEDELCMD" --ssh-user ubuntu -i "$PWD/.chef/id_rsa.pem" --attribute cloud.public_hostname'''
                    sh 'aws cloudformation delete-stack --stack-name $STACKID'
                //slack step
                slackSend color: "good", message: "Build#: $BUILD_NUMBER: cleaned up and removed test node"
                slackSend color: "good", message: "Here is the path to the updated YAML file: s3://kubefiles-ac/reactappkube-$BUILD_NUMBER-1.yml"
            }
            
        }

    }
}