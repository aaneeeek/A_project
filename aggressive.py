import matplotlib.pyplot as plt
from matplotlib.patches import Circle
import math

fig, ax =plt.subplots()
ax.set_xlim(0,35)
ax.set_ylim(-6,35)
diff=[]
this_dict={#this dict will be used for labelling the different circles representing the aggresive cows and their position
    "0":"A",
    "1":"B",
    "2":"C",
    "3":"D",
    "4":"E",
    "5":"F",
    "6":"G"
    }
distx=14
disty=5

class Cow_pos():#object used to store data of each aggressive cow
    def __init__(self, level, pos,name,ith,params,predecessor=None):
        self.level=level
        self.pos = pos
        self.predecessor=predecessor
        self.name=name
        self.successor=[]
        self.ith=ith
        self.x, self.y, self.angle=params
        self.difference=0


    def add_successor(successor):
        self.successor.append(successor)

    def assigner(self, aggresive, arr,lx=14,ly=15):
        global diff
        global ax
        global this_dict
        #if we are the count is on the last aggressive cow then
        if self.level+1==len(aggresive):
            self.difference=self.pos-self.predecessor.pos
            if self.predecessor.difference!=0 and self.predecessor.difference<self.difference:
                self.difference=self.predecessor.difference
            diff.append(self.difference)
            return 0
        #end is the length of unclassified agreesive cows
        end = len(aggresive[self.level+1:])-1
        #this condition is equivalent to the one above
        if end<0:
            self.difference=self.pos-self.predecessor.pos
            if self.predecessor.difference!=0 and self.predecessor.difference<self.difference:
                self.difference=self.predecessor.difference
            diff.append(self.difference)
            return 0


        lenth=len(arr)
        b=0
        d=self.angle
        try:#ensuring we are not dividin by zero
            ranges=self.angle/(len(arr[self.ith+1:lenth-end])-1)
        except:
            ranges=self.angle/(len(arr[self.ith+1:lenth-end]))
        ranges*=2
        global distx
        global disty
        for i, a in enumerate(arr[self.ith+1:lenth-end]):
            b+=1

            x=self.x+math.cos((d)/180)*lx
            y=self.y+math.sin((d)/180)*ly
            #creating a new insatance of the class
            new = Cow_pos(level=self.level+1, pos=a, name=aggresive[self.level+1], predecessor=self, ith=self.ith+b,params=(x,y,self.angle-65))
            #ploting circles at different positions and connecting them with lines
            plt.plot([self.x,x],[self.y,y],zorder=1)
            circle=Circle((x,y), radius=1.1, edgecolor='black', facecolor='skyblue', zorder=2)
            ax.add_patch(circle)
            ax.text(x,y,f"{this_dict[new.name]}={new.pos}", ha="center", va="center", zorder=3, fontsize=9)

            d-=ranges
            # getting the position difference between cow object and preceding cow object
            new.difference=new.pos-new.predecessor.pos
            #on a particular path we make sure we chose the minimum seperation by always comparing the objects difference attribute and it's predecessor difference attribute
            if new.predecessor.difference!=0 and new.predecessor.difference<new.difference:
                new.difference=new.predecessor.difference

            #calling the assihn method of the new instance,before completing the loop (this is a use of depth first search)
            new.assigner(aggresive,arr,lx-4,ly-4)

        if self.level ==0:
            print(f"min seperation= {max(diff)}")
            diff=[]




#function to arrange the problem as a search algorithm
def aggresive_cows(n,k,arr):
    arr.sort()
    aggressive= [f"{i}" for i in range(k)]
    first=Cow_pos(level=0, pos=arr[0], name=aggressive[0], ith=0,params=(1,10,180))
    circle=Circle((1,10), radius=0.8, edgecolor='black', facecolor='skyblue', zorder=2)
    ax.add_patch(circle)
    ax.text(1,10,f"{this_dict[first.name]}={first.pos}", ha="center", va="center", zorder=3, fontsize=10)
    first.assigner(aggressive, arr)


#testing code with an array arr
arr=[1,2,3,4,5,6,7]
aggresive_cows(7,4,arr)
plt.show()