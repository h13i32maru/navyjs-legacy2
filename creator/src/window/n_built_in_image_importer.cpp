#include "n_built_in_image_importer.h"
#include "ui_n_built_in_image_importer.h"

NBuiltInImageImporter::NBuiltInImageImporter(QWidget *parent) :
    QDialog(parent),
    ui(new Ui::NBuiltInImageImporter)
{
    ui->setupUi(this);
}

NBuiltInImageImporter::~NBuiltInImageImporter()
{
    delete ui;
}
