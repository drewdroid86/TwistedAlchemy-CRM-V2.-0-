const fs = require('fs');

const file = 'src/views/Projects.tsx';
let code = fs.readFileSync(file, 'utf8');

const imports = `
import ProjectDetailsModal from '../components/projects/ProjectDetailsModal';
import NewProjectModal from '../components/projects/NewProjectModal';
import HistoricalSaleModal from '../components/projects/HistoricalSaleModal';
`;
code = code.replace(/import ImageUpload from '\.\.\/components\/ImageUpload';\n/, "import ImageUpload from '../components/ImageUpload';\n" + imports);

code = code.replace(/Calculator, Camera, Image as ImageIcon/, "Camera");

const startDetails = code.indexOf('{/* Project Detail Modal */}');
const endDetails = code.indexOf('{/* New Project Modal */}');
const detailsJSX = code.substring(startDetails, endDetails);

code = code.replace(detailsJSX, `{/* Project Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectDetailsModal
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            showCalculator={showCalculator}
            setShowCalculator={setShowCalculator}
            updateStatus={updateStatus}
            updateFinancials={updateFinancials}
            handleGenerateInvoice={handleGenerateInvoice}
            addProjectImage={addProjectImage}
            removeProjectImage={removeProjectImage}
            PRICING_STRATEGIES={PRICING_STRATEGIES}
          />
        )}
      </AnimatePresence>

      `);

const startNew = code.indexOf('{/* New Project Modal */}');
const endNew = code.indexOf('{/* Historical Sale Modal */}');
const newJSX = code.substring(startNew, endNew);

code = code.replace(newJSX, `{/* New Project Modal */}
      {isModalOpen && (
        <NewProjectModal
          setIsModalOpen={setIsModalOpen}
          newProject={newProject}
          setNewProject={setNewProject}
          handleCreate={handleCreate}
        />
      )}

      `);

const startHistorical = code.indexOf('{/* Historical Sale Modal */}');
const endHistorical = code.indexOf('    </div>\n  );\n}\n');
if (endHistorical !== -1) {
  const historicalJSX = code.substring(startHistorical, endHistorical);
  code = code.replace(historicalJSX, `{/* Historical Sale Modal */}
      {isHistoricalModalOpen && (
        <HistoricalSaleModal
          setIsHistoricalModalOpen={setIsHistoricalModalOpen}
          historicalSale={historicalSale}
          setHistoricalSale={setHistoricalSale}
          handleCreateHistorical={handleCreateHistorical}
          inventory={inventory}
          customers={customers}
        />
      )}
`);
}

fs.writeFileSync(file, code);
