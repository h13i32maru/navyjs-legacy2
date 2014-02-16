#include "n_manifest_widget.h"
#include "ui_n_manifest_widget.h"

#include <util/n_json.h>
#include <util/n_util.h>

NManifestWidget::NManifestWidget(const QString &filePath, QWidget *parent) : NFileWidget(filePath, parent), ui(new Ui::NManifestWidget)
{
    ui->setupUi(this);

    NJson json;
    json.parseFromFilePath(filePath);
    NJson resources = json.getObject("assets");

    for (int i = 0; i < resources.length(); i++) {
        QStringList row;
        NUtil::expand(row, 2);
        QString index = QString::number(i);
        row[0] = resources.getStr(index + ".path");
        row[1] = resources.getStr(index + ".hash");

        QTreeWidgetItem *item = new QTreeWidgetItem(row);
        ui->resourcesTreeWidget->addTopLevelItem(item);
    }
}

NManifestWidget::~NManifestWidget()
{
    delete ui;
}

bool NManifestWidget::innerSave() {
    return true;
}
