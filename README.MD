To run the project locally please refer to run.md

ai tools use

Claude model - opus 4.8

how

- researching example given researching standards for storing and validating json schema
- writing endpoints based on previous specs I have provided

All components on the front end, hooks and pages on the fron end where verified

And all endpoints and functions were
verified

data model choices

the data models core concept is the use of a json schema for every form the form in this case is the identifier and the acually json representation of the form fields are stored on another table form versions, each form can have multiple versions but the current version is stored against the form under current version

submissions ( responses are ) recorded agaisnt a form version rather thana from to allow them to be viewed regardless of future changes

The trade-offs you made and what you would add or change with more time. • The AI tools you used and how (see the section above).

Design Decisions
the first design decision made was to store metadata required for rendering the form within teh json schema , byy doing this I have extended the spec adn the json schemas stored in tehdatabase are not fully complaint with teh spec

As a result these addtional properties must beignored by a JSON schema parse in order to not cause errors on complation this was done so the instructions to render a from can be kept close to the schema rather than the complexity that comes with definig the validtion rules and schema of a form on one table and the rendering rules on another, another this makes the schema extensible and self defining

the fromemngine supports validation rules defined bhy the json schema spec for varios data types and this is testiend in the fromengine_test package
the data types that were selected for this assesment were

string
string enums (selects and multi selects)
numbers
Date
booleans

storing submissions agaisnt form versions ensures that responses can be viewed regardless of future changes

on the front end forms are rendered by a dompoenent teh dyncamic form renderier which is powered by antd from input componenetsthey are rendered based on the x-widget property
there is abuilder componenet that creates forms and for each widget type there is a builder to create and handle
